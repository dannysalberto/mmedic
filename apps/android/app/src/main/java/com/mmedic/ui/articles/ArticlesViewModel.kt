package com.mmedic.ui.articles

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mmedic.data.api.ApiClient
import com.mmedic.data.api.LoginDto
import com.mmedic.data.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ArticlesUiState(
    val articles: List<Article> = emptyList(),
    val filteredArticles: List<Article> = emptyList(),
    val categories: List<ArticleCategory> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val searchQuery: String = "",
    val selectedCategoryId: String? = null
)

class ArticlesViewModel : ViewModel() {

    private val api = ApiClient.createArticlesApi()
    private val mainApi = ApiClient.create()

    private val _uiState = MutableStateFlow(ArticlesUiState())
    val uiState: StateFlow<ArticlesUiState> = _uiState.asStateFlow()

    init {
        ensureAuthAndLoad()
    }

    fun ensureAuthAndLoad() {
        viewModelScope.launch {
            try {
                // Si aún no tenemos token, realizamos auto-login con credenciales predeterminadas para sincronización
                if (ApiClient.authToken == null) {
                    try {
                        val loginRes = mainApi.login(LoginDto("superadmin", "superadmin@123#"))
                        ApiClient.authToken = loginRes.accessToken
                    } catch (e: Exception) {
                        // Continuar en caso de que endpoints públicos o dev
                    }
                }
                loadCategories()
                loadArticles()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Error al conectar con la API: ${e.message}"
                )
            }
        }
    }

    fun loadArticles() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val res = api.getArticles()
                val list = if (res.success) res.data else emptyList()
                _uiState.value = _uiState.value.copy(
                    articles = list,
                    isLoading = false
                )
                applyFilters()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Error al cargar artículos: ${e.message}"
                )
            }
        }
    }

    fun loadCategories() {
        viewModelScope.launch {
            try {
                val res = api.getCategories()
                if (res.success) {
                    _uiState.value = _uiState.value.copy(categories = res.data)
                }
            } catch (e: Exception) {
                // Silencioso o log
            }
        }
    }

    fun setSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        applyFilters()
    }

    fun setSelectedCategory(catId: String?) {
        _uiState.value = _uiState.value.copy(selectedCategoryId = catId)
        applyFilters()
    }

    private fun applyFilters() {
        val q = _uiState.value.searchQuery.trim().lowercase()
        val catId = _uiState.value.selectedCategoryId

        val filtered = _uiState.value.articles.filter { article ->
            val matchSearch = q.isEmpty() ||
                    article.code.lowercase().contains(q) ||
                    article.name.lowercase().contains(q)
            val matchCat = catId == null || article.categoryId == catId
            matchSearch && matchCat
        }
        _uiState.value = _uiState.value.copy(filteredArticles = filtered)
    }

    fun createCategory(name: String, onComplete: (ArticleCategory?) -> Unit) {
        viewModelScope.launch {
            try {
                val res = api.createCategory(CreateCategoryDto(name))
                if (res.success) {
                    loadCategories()
                    onComplete(res.data)
                } else {
                    onComplete(null)
                }
            } catch (e: Exception) {
                onComplete(null)
            }
        }
    }

    fun createEntity(code: String, name: String, status: String, onComplete: (Entity?) -> Unit) {
        viewModelScope.launch {
            try {
                val res = api.createEntity(CreateEntityDto(code = code, name = name, status = status))
                if (res.success) {
                    onComplete(res.data)
                } else {
                    onComplete(null)
                }
            } catch (e: Exception) {
                onComplete(null)
            }
        }
    }

    fun searchEntityByCode(code: String, onResult: (Entity?, String?) -> Unit) {
        viewModelScope.launch {
            try {
                val res = api.getEntityByCode(code)
                if (res.success) {
                    onResult(res.data, null)
                } else {
                    onResult(null, "Entidad con código '$code' no encontrada")
                }
            } catch (e: Exception) {
                onResult(null, "No se encontró entidad con código '$code'")
            }
        }
    }

    fun createArticle(
        code: String,
        name: String,
        categoryId: String,
        p1: Double,
        p2: Double?,
        p3: Double?,
        p4: Double?,
        appliesVat: Boolean = false,
        participants: List<ParticipantItemState>,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            // Validación constitucional y regla de negocio: suma <= 100.00%
            val totalPerc = participants.sumOf { it.percentage }
            if (totalPerc > 100.001) {
                onError("La suma de porcentajes (${String.format("%.2f", totalPerc)}%) no puede superar el 100.00%")
                return@launch
            }

            try {
                val participantDtos = participants.map {
                    ArticleParticipantItemDto(entityId = it.entityId, percentage = it.percentage)
                }
                val dto = CreateArticleDto(
                    code = code,
                    name = name,
                    categoryId = categoryId,
                    price1 = p1,
                    price2 = p2,
                    price3 = p3,
                    price4 = p4,
                    appliesVat = appliesVat,
                    participants = participantDtos
                )
                val res = api.createArticle(dto)
                if (res.success) {
                    loadArticles()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al crear artículo")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al guardar artículo")
            }
        }
    }

    fun updateArticle(
        id: String,
        code: String,
        name: String,
        categoryId: String,
        p1: Double,
        p2: Double?,
        p3: Double?,
        p4: Double?,
        appliesVat: Boolean = false,
        participants: List<ParticipantItemState>,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            val totalPerc = participants.sumOf { it.percentage }
            if (totalPerc > 100.001) {
                onError("La suma de porcentajes (${String.format("%.2f", totalPerc)}%) no puede superar el 100.00%")
                return@launch
            }

            try {
                val participantDtos = participants.map {
                    ArticleParticipantItemDto(entityId = it.entityId, percentage = it.percentage)
                }
                val dto = CreateArticleDto(
                    code = code,
                    name = name,
                    categoryId = categoryId,
                    price1 = p1,
                    price2 = p2,
                    price3 = p3,
                    price4 = p4,
                    appliesVat = appliesVat,
                    participants = participantDtos
                )
                val res = api.updateArticle(id, dto)
                if (res.success) {
                    loadArticles()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al actualizar artículo")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al actualizar artículo")
            }
        }
    }
}

