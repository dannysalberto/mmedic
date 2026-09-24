package com.mmedic.data.api

import com.mmedic.data.model.ApiResponse
import com.mmedic.data.model.CreateCustomerDto
import com.mmedic.data.model.UpdateCustomerDto
import com.mmedic.data.model.Customer
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface CustomersApiService {
    @GET("api/v1/customers")
    suspend fun getCustomers(@Query("search") search: String? = null): ApiResponse<List<Customer>>

    @POST("api/v1/customers")
    suspend fun createCustomer(@Body dto: CreateCustomerDto): ApiResponse<Customer>

    @PUT("api/v1/customers/{id}")
    suspend fun updateCustomer(
        @Path("id") id: String,
        @Body dto: UpdateCustomerDto
    ): ApiResponse<Customer>

    @DELETE("api/v1/customers/{id}")
    suspend fun deleteCustomer(@Path("id") id: String): ApiResponse<Map<String, String>>
}
