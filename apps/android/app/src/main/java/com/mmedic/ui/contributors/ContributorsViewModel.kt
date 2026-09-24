package com.mmedic.ui.contributors

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mmedic.data.api.ApiClient
import com.mmedic.data.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ContributorsUiState(
    val contributors: List<ContributorWithStats> = emptyList(),
    val filteredContributors: List<ContributorWithStats> = emptyList(),
    val duplicates: List<DuplicateContributorGroup> = emptyList(),
    val isLoading: Boolean = false,
    val isLoadingDuplicates: Boolean = false,
    val searchQuery: String = "",
    val selectedStatus: String = "all",
    val errorMessage: String? = null
)

class ContributorsViewModel : ViewModel() {

    private val api = ApiClient.createContributorsApi()

    private val _uiState = MutableStateFlow(ContributorsUiState())
    val uiState: StateFlow<ContributorsUiState> = _uiState.asStateFlow()

    init {
        loadContributors()
    }

    fun loadContributors() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val statusParam = if (_uiState.value.selectedStatus != "all") _uiState.value.selectedStatus else null
                val res = api.getContributors(search = _uiState.value.searchQuery.ifBlank { null }, status = statusParam)
                val list = if (res.success) res.data else emptyList()
                _uiState.value = _uiState.value.copy(
                    contributors = list,
                    filteredContributors = list,
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Error al cargar colaboradores: ${e.message}"
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
        loadContributors()
    }

    fun setSelectedStatus(status: String) {
        _uiState.value = _uiState.value.copy(selectedStatus = status)
        loadContributors()
    }

    fun createContributor(
        code: String,
        name: String,
        status: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val res = api.createContributor(CreateContributorDto(code = code, name = name, status = status))
                if (res.success) {
                    loadContributors()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al crear colaborador")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al crear colaborador")
            }
        }
    }

    fun updateContributor(
        id: String,
        code: String,
        name: String,
        status: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val res = api.updateContributor(
                    id,
                    UpdateContributorDto(code = code, name = name, status = status)
                )
                if (res.success) {
                    loadContributors()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al actualizar colaborador")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error al actualizar colaborador")
            }
        }
    }

    fun deleteContributor(
        contributor: ContributorWithStats,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        if (contributor.articlesCount > 0) {
            onError("No se puede eliminar a '${contributor.name}' porque está vinculado a ${contributor.articlesCount} registro(s). Desasócielo previamente o cámbielo a INACTIVO.")
            return
        }

        viewModelScope.launch {
            try {
                val res = api.deleteContributor(contributor.id)
                if (res.success) {
                    loadContributors()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al eliminar colaborador")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al eliminar colaborador")
            }
        }
    }

    fun mergeContributors(
        primaryId: String,
        secondaryId: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val res = api.mergeContributors(MergeContributorsDto(primaryId, secondaryId))
                if (res.success) {
                    loadContributors()
                    loadDuplicates()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al consolidar colaboradores")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al consolidar colaboradores")
            }
        }
    }
}
