package com.mmedic.ui.invoices

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mmedic.data.api.ApiClient
import com.mmedic.data.api.LoginDto
import com.mmedic.data.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.math.BigDecimal
import java.math.RoundingMode

data class InvoicesUiState(
    val invoices: List<InvoiceWithDetails> = emptyList(),
    val filteredInvoices: List<InvoiceWithDetails> = emptyList(),
    val customers: List<Customer> = emptyList(),
    val articles: List<Article> = emptyList(),
    val entities: List<Entity> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val searchQuery: String = "",
    val selectedStatus: String = "ALL",
    // Create Invoice Form State
    val selectedCustomer: Customer? = null,
    val invoiceType: InvoiceType = InvoiceType.CASH,
    val draftItems: List<DraftInvoiceItem> = emptyList(),
    val draftPayments: List<CreateInvoicePaymentDto> = emptyList(),
    val notes: String = "",
    val isSubmitting: Boolean = false,
    // Active Modal Preview / Actions
    val previewInvoice: InvoiceWithDetails? = null,
    val paymentInvoice: InvoiceWithDetails? = null,
    val voidTargetInvoice: InvoiceWithDetails? = null
)

data class DraftInvoiceItem(
    val article: Article,
    val entity: Entity,
    val priceType: PriceType,
    val quantity: Double,
    val basePrice: Double,
    val vatAmount: Double,
    val subtotal: Double,
    val total: Double
)

class InvoicesViewModel : ViewModel() {
    private val invoicesApi = ApiClient.createInvoicesApi()
    private val customersApi = ApiClient.createCustomersApi()
    private val articlesApi = ApiClient.createArticlesApi()
    private val entitiesApi = ApiClient.createEntitiesApi()
    private val mainApi = ApiClient.create()

    private val _uiState = MutableStateFlow(InvoicesUiState())
    val uiState: StateFlow<InvoicesUiState> = _uiState.asStateFlow()

    init {
        ensureAuthAndLoad()
    }

    fun ensureAuthAndLoad() {
        viewModelScope.launch {
            try {
                if (ApiClient.authToken == null) {
                    try {
                        val loginRes = mainApi.login(LoginDto("superadmin", "superadmin@123#"))
                        ApiClient.authToken = loginRes.accessToken
                    } catch (_: Exception) {}
                }
                loadInvoices()
                loadCustomers()
                loadArticles()
                loadEntities()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Error de conexión: ${e.message}"
                )
            }
        }
    }

    fun loadInvoices() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val statusParam = if (_uiState.value.selectedStatus != "ALL") _uiState.value.selectedStatus else null
                val res = invoicesApi.getInvoices(
                    status = statusParam,
                    search = _uiState.value.searchQuery.ifBlank { null }
                )
                val list = res.data ?: emptyList()
                _uiState.value = _uiState.value.copy(
                    invoices = list,
                    filteredInvoices = list,
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Error al cargar facturas: ${e.message}"
                )
            }
        }
    }

    fun loadCustomers(search: String? = null) {
        viewModelScope.launch {
            try {
                val res = customersApi.getCustomers(search)
                _uiState.value = _uiState.value.copy(customers = res.data ?: emptyList())
            } catch (_: Exception) {}
        }
    }

    fun loadArticles() {
        viewModelScope.launch {
            try {
                val res = articlesApi.getArticles()
                val list = res.data ?: emptyList()
                _uiState.value = _uiState.value.copy(articles = list.filter { it.isActive })
            } catch (_: Exception) {}
        }
    }

    fun loadEntities() {
        viewModelScope.launch {
            try {
                val res = entitiesApi.getEntities()
                val list = res.data ?: emptyList()
                val entities = list.filter { it.status == "ACTIVE" }.map {
                    Entity(id = it.id, code = it.code, name = it.name, status = it.status)
                }
                _uiState.value = _uiState.value.copy(entities = entities)
            } catch (_: Exception) {}
        }
    }

    fun setSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        loadInvoices()
    }

    fun setStatusFilter(status: String) {
        _uiState.value = _uiState.value.copy(selectedStatus = status)
        loadInvoices()
    }

    fun selectCustomer(customer: Customer?) {
        _uiState.value = _uiState.value.copy(selectedCustomer = customer)
    }

    fun setInvoiceType(type: InvoiceType) {
        _uiState.value = _uiState.value.copy(invoiceType = type)
    }

    fun setNotes(notes: String) {
        _uiState.value = _uiState.value.copy(notes = notes)
    }

    fun createCustomerQuick(dto: CreateCustomerDto, onDone: (Customer) -> Unit) {
        viewModelScope.launch {
            try {
                val res = customersApi.createCustomer(dto)
                if (res.success && res.data != null) {
                    val newCust = res.data
                    val updated = listOf(newCust) + _uiState.value.customers
                    _uiState.value = _uiState.value.copy(
                        customers = updated,
                        selectedCustomer = newCust,
                        successMessage = "Cliente registrado: ${newCust.name}"
                    )
                    onDone(newCust)
                } else {
                    _uiState.value = _uiState.value.copy(errorMessage = res.message ?: "Error al registrar cliente")
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(errorMessage = "Error al crear cliente: ${e.message}")
            }
        }
    }

    fun addDraftItem(article: Article, entity: Entity, priceType: PriceType, qty: Double) {
        val rawPrice = when (priceType) {
            PriceType.PRICE_1 -> article.price1
            PriceType.PRICE_2 -> article.price2 ?: article.price1
            PriceType.PRICE_3 -> article.price3 ?: article.price1
            PriceType.PRICE_4 -> article.price4 ?: article.price1
        }
        val basePrice = round3(rawPrice)
        val vatAmount = if (article.appliesVat == true) round3(basePrice * 0.16) else 0.0
        val subtotal = round3(basePrice + vatAmount)
        val total = round3(subtotal * qty)

        val item = DraftInvoiceItem(
            article = article,
            entity = entity,
            priceType = priceType,
            quantity = qty,
            basePrice = basePrice,
            vatAmount = vatAmount,
            subtotal = subtotal,
            total = total
        )
        _uiState.value = _uiState.value.copy(draftItems = _uiState.value.draftItems + item)
    }

    fun removeDraftItem(index: Int) {
        val updated = _uiState.value.draftItems.filterIndexed { i, _ -> i != index }
        _uiState.value = _uiState.value.copy(draftItems = updated)
    }

    fun addDraftPayment(dto: CreateInvoicePaymentDto) {
        _uiState.value = _uiState.value.copy(draftPayments = _uiState.value.draftPayments + dto)
    }

    fun removeDraftPayment(index: Int) {
        val updated = _uiState.value.draftPayments.filterIndexed { i, _ -> i != index }
        _uiState.value = _uiState.value.copy(draftPayments = updated)
    }

    fun calculateTotals(): Triple<Double, Double, Double> {
        var subtotal = 0.0
        var vat = 0.0
        for (item in _uiState.value.draftItems) {
            subtotal += round3(item.basePrice * item.quantity)
            vat += round3(item.vatAmount * item.quantity)
        }
        val total = round3(subtotal + vat)
        return Triple(round3(subtotal), round3(vat), total)
    }

    fun createInvoice(onSuccess: (InvoiceWithDetails) -> Unit) {
        val customer = _uiState.value.selectedCustomer
        if (customer == null) {
            _uiState.value = _uiState.value.copy(errorMessage = "Seleccione un cliente")
            return
        }
        if (_uiState.value.draftItems.isEmpty()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Agregue al menos un artículo")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, errorMessage = null)
            try {
                val itemsDto = _uiState.value.draftItems.map {
                    CreateInvoiceItemDto(
                        articleId = it.article.id,
                        entityId = it.entity.id,
                        priceType = it.priceType,
                        quantity = it.quantity
                    )
                }
                val dto = CreateInvoiceDto(
                    customerId = customer.id,
                    type = _uiState.value.invoiceType,
                    items = itemsDto,
                    payments = _uiState.value.draftPayments,
                    notes = _uiState.value.notes.ifBlank { null }
                )
                val res = invoicesApi.createInvoice(dto)
                if (res.success && res.data != null) {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        draftItems = emptyList(),
                        draftPayments = emptyList(),
                        selectedCustomer = null,
                        notes = "",
                        successMessage = "Factura emitida: ${res.data.invoiceNumber}"
                    )
                    loadInvoices()
                    onSuccess(res.data)
                } else {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        errorMessage = res.message ?: "Error al emitir factura"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    errorMessage = "Error al emitir factura: ${e.message}"
                )
            }
        }
    }

    fun openPreview(invoice: InvoiceWithDetails) {
        _uiState.value = _uiState.value.copy(previewInvoice = invoice)
    }

    fun closePreview() {
        _uiState.value = _uiState.value.copy(previewInvoice = null)
    }

    fun openPaymentModal(invoice: InvoiceWithDetails) {
        _uiState.value = _uiState.value.copy(paymentInvoice = invoice)
    }

    fun closePaymentModal() {
        _uiState.value = _uiState.value.copy(paymentInvoice = null)
        loadInvoices()
    }

    fun promptVoid(invoice: InvoiceWithDetails) {
        _uiState.value = _uiState.value.copy(voidTargetInvoice = invoice)
    }

    fun cancelVoid() {
        _uiState.value = _uiState.value.copy(voidTargetInvoice = null)
    }

    fun confirmVoid(reason: String) {
        val target = _uiState.value.voidTargetInvoice ?: return
        viewModelScope.launch {
            try {
                val res = invoicesApi.voidInvoice(target.id, VoidInvoiceDto(reason))
                if (res.success) {
                    _uiState.value = _uiState.value.copy(
                        voidTargetInvoice = null,
                        successMessage = "Factura ${target.invoiceNumber} anulada"
                    )
                    loadInvoices()
                } else {
                    _uiState.value = _uiState.value.copy(errorMessage = res.message ?: "Error al anular")
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(errorMessage = "Error al anular: ${e.message}")
            }
        }
    }

    fun addPaymentToInvoice(invoiceId: String, dto: CreateInvoicePaymentDto) {
        viewModelScope.launch {
            try {
                val res = invoicesApi.addPayment(invoiceId, dto)
                if (res.success && res.data != null) {
                    _uiState.value = _uiState.value.copy(
                        paymentInvoice = res.data,
                        successMessage = "Pago registrado exitosamente"
                    )
                    loadInvoices()
                } else {
                    _uiState.value = _uiState.value.copy(errorMessage = res.message ?: "Error al registrar pago")
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(errorMessage = "Error al registrar pago: ${e.message}")
            }
        }
    }

    fun deletePayment(invoiceId: String, paymentId: String) {
        viewModelScope.launch {
            try {
                val res = invoicesApi.deletePayment(invoiceId, paymentId)
                if (res.success && res.data != null) {
                    _uiState.value = _uiState.value.copy(
                        paymentInvoice = res.data,
                        successMessage = "Pago eliminado y saldo actualizado"
                    )
                    loadInvoices()
                } else {
                    _uiState.value = _uiState.value.copy(errorMessage = res.message ?: "Error al eliminar pago")
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(errorMessage = "Error al eliminar pago: ${e.message}")
            }
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(errorMessage = null, successMessage = null)
    }

    companion object {
        fun round3(value: Double): Double {
            return BigDecimal.valueOf(value).setScale(3, RoundingMode.HALF_UP).toDouble()
        }
    }
}
