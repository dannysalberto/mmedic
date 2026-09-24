package com.mmedic.data.repository

import com.mmedic.data.api.ApiClient
import com.mmedic.data.model.ApiResponse
import com.mmedic.data.model.CreateCustomerDto
import com.mmedic.data.model.Customer
import com.mmedic.data.model.UpdateCustomerDto

class CustomerRepository {
    private val api = ApiClient.createCustomersApi()

    suspend fun getCustomers(search: String? = null): ApiResponse<List<Customer>> {
        return api.getCustomers(search = search)
    }

    suspend fun createCustomer(dto: CreateCustomerDto): ApiResponse<Customer> {
        return api.createCustomer(dto)
    }

    suspend fun updateCustomer(id: String, dto: UpdateCustomerDto): ApiResponse<Customer> {
        return api.updateCustomer(id, dto)
    }

    suspend fun deleteCustomer(id: String): ApiResponse<Map<String, String>> {
        return api.deleteCustomer(id)
    }
}
