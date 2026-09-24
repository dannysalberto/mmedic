package com.mmedic.ui.customers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mmedic.data.model.CreateCustomerDto
import com.mmedic.data.model.Customer
import com.mmedic.data.model.UpdateCustomerDto
import com.mmedic.data.repository.CustomerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CustomersUiState(
    val customers: List<Customer> = emptyList(),
    val isLoading: Boolean = false,
    val searchQuery: String = "",
    val errorMessage: String? = null
)

class CustomersViewModel(
    private val repository: CustomerRepository = CustomerRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(CustomersUiState())
    val uiState: StateFlow<CustomersUiState> = _uiState.asStateFlow()

    init {
        loadCustomers()
    }

    fun loadCustomers() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val res = repository.getCustomers(search = _uiState.value.searchQuery.ifBlank { null })
                val list = if (res.success && res.data != null) res.data else emptyList()
                _uiState.value = _uiState.value.copy(
                    customers = list,
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Error al cargar clientes: ${e.message}"
                )
            }
        }
    }

    fun setSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        loadCustomers()
    }

    fun createCustomer(
        taxId: String,
        name: String,
        phone: String?,
        email: String?,
        address: String?,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val dto = CreateCustomerDto(
                    taxId = taxId,
                    name = name,
                    phone = phone?.ifBlank { null },
                    email = email?.ifBlank { null },
                    address = address?.ifBlank { null }
                )
                val res = repository.createCustomer(dto)
                if (res.success) {
                    loadCustomers()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al crear cliente")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al crear cliente")
            }
        }
    }

    fun updateCustomer(
        id: String,
        taxId: String,
        name: String,
        phone: String?,
        email: String?,
        address: String?,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val dto = UpdateCustomerDto(
                    taxId = taxId,
                    name = name,
                    phone = phone?.ifBlank { null },
                    email = email?.ifBlank { null },
                    address = address?.ifBlank { null }
                )
                val res = repository.updateCustomer(id, dto)
                if (res.success) {
                    loadCustomers()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al actualizar cliente")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error de red al actualizar cliente")
            }
        }
    }

    fun deleteCustomer(
        id: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val res = repository.deleteCustomer(id)
                if (res.success) {
                    loadCustomers()
                    onSuccess()
                } else {
                    onError(res.message ?: "Error al eliminar cliente")
                }
            } catch (e: Exception) {
                val msg = if (e.message?.contains("409") == true) {
                    "No se puede eliminar el cliente porque posee facturas vinculadas."
                } else {
                    e.message ?: "Error de red al eliminar cliente"
                }
                onError(msg)
            }
        }
    }
}
