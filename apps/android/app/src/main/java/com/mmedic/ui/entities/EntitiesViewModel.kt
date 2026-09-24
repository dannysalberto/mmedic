package com.mmedic.ui.entities

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mmedic.data.api.ApiClient
import com.mmedic.data.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class EntitiesUiState(
    val entities: List<EntityWithStats> = emptyList(),
    val filteredEntities: List<EntityWithStats> = emptyList(),
    val duplicates: List<DuplicateEntityGroup> = emptyList(),
    val isLoading: Boolean = false,
    val isLoadingDuplicates: Boolean = false,
    val searchQuery: String = "",
    val selectedStatus: String = "all",
    val errorMessage: String? = null
)

class EntitiesViewModel : ViewModel() {

    private val api = ApiClient.createEntitiesApi()

    private val _uiState = MutableStateFlow(EntitiesUiState())
    val uiState: StateFlow<EntitiesUiState> = _uiState.asStateFlow()

    init {
        loadEntities()
    }

    fun loadEntities() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val statusParam = if (_uiState.value.selectedStatus != "all") _uiState.value.selectedStatus else null
                val res = api.getEntities(search = _uiState.value.searchQuery.ifBlank { null }, status = statusParam)
                val list = if (res.success) res.data else emptyList()
                _uiState.value = _uiState.value.copy(
                    entities = list,
                    filteredEntities = list,
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Error al cargar entidades: ${e.message}"
                )
            }
        }
    }

    fun loadDuplicates() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingDuplicates = true)
            try {
                val res = api.getDuplicates()
                val list = if (res.success) res.data else emptyList()
                _uiState.value = _uiState.value.copy(
                    duplicates = list,
                    isLoadingDuplicates = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoadingDuplicates = false)
            }
        }
    }

    fun setSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        loadEntities()
    }

    fun setSelectedStatus(status: String) {
        _uiState.value = _uiState.value.copy(selectedStatus = status)
        loadEntities()
    }

    fun createEntity(
        code: String,
        name: String,
        status: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val res = api.createEntity(CreateEntityDto(code = code, name = name, status = status))
                if (res.success) {
                    loadEntities()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al crear entidad")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al crear entidad")
            }
        }
    }

    fun updateEntity(
        id: String,
        code: String,
        name: String,
        status: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val res = api.updateEntity(id, UpdateEntityDto(code = code, name = name, status = status))
                if (res.success) {
                    loadEntities()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al actualizar entidad")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al actualizar entidad")
            }
        }
    }

    fun deleteEntity(
        id: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val res = api.deleteEntity(id)
                if (res.success) {
                    loadEntities()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al eliminar entidad")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error al eliminar entidad")
            }
        }
    }

    fun mergeEntities(
        primaryId: String,
        secondaryId: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val res = api.mergeEntities(MergeEntitiesDto(primaryEntityId = primaryId, secondaryEntityId = secondaryId))
                if (res.success) {
                    loadEntities()
                    loadDuplicates()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al fusionar entidades")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al fusionar entidades")
            }
        }
    }
}
