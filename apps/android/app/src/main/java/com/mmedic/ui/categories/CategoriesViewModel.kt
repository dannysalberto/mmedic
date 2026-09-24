package com.mmedic.ui.categories

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mmedic.data.api.ApiClient
import com.mmedic.data.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CategoriesUiState(
    val categories: List<CategoryWithStats> = emptyList(),
    val filteredCategories: List<CategoryWithStats> = emptyList(),
    val duplicates: List<DuplicateCategoryGroup> = emptyList(),
    val isLoading: Boolean = false,
    val isLoadingDuplicates: Boolean = false,
    val searchQuery: String = "",
    val errorMessage: String? = null,
    val successMessage: String? = null
)

class CategoriesViewModel : ViewModel() {

    private val api = ApiClient.createCategoriesApi()

    private val _uiState = MutableStateFlow(CategoriesUiState())
    val uiState: StateFlow<CategoriesUiState> = _uiState.asStateFlow()

    init {
        loadCategories()
    }

    fun loadCategories() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val res = api.getCategories()
                val list = if (res.success) res.data else emptyList()
                _uiState.value = _uiState.value.copy(
                    categories = list,
                    filteredCategories = filterList(list, _uiState.value.searchQuery),
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Error al cargar categorías: ${e.message}"
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
                _uiState.value = _uiState.value.copy(duplicates = list, isLoadingDuplicates = false)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoadingDuplicates = false)
            }
        }
    }

    fun search(query: String) {
        _uiState.value = _uiState.value.copy(
            searchQuery = query,
            filteredCategories = filterList(_uiState.value.categories, query)
        )
    }

    private fun filterList(list: List<CategoryWithStats>, query: String): List<CategoryWithStats> {
        return if (query.isBlank()) list
        else list.filter { it.name.contains(query, ignoreCase = true) }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(errorMessage = null, successMessage = null)
    }

    fun createCategory(name: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val res = api.createCategory(CreateCategoryDto(name = name))
                if (res.success) { loadCategories(); onSuccess() }
                else onError(res.message ?: "Error al crear categoría")
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al crear categoría")
            }
        }
    }

    fun updateCategory(id: String, name: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val res = api.updateCategory(id, UpdateCategoryDto(name = name))
                if (res.success) { loadCategories(); onSuccess() }
                else onError(res.message ?: "Error al actualizar categoría")
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al actualizar categoría")
            }
        }
    }

    fun deleteCategory(id: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val res = api.deleteCategory(id)
                if (res.success) { loadCategories(); onSuccess() }
                else onError(res.message ?: "Error al eliminar categoría")
            } catch (e: Exception) {
                onError(e.message ?: "Error al eliminar categoría")
            }
        }
    }

    fun mergeCategories(
        primaryId: String,
        secondaryId: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val res = api.mergeCategories(MergeCategoriesDto(primaryCategoryId = primaryId, secondaryCategoryId = secondaryId))
                if (res.success) {
                    loadCategories()
                    loadDuplicates()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al fusionar categorías")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al fusionar categorías")
            }
        }
    }
}
