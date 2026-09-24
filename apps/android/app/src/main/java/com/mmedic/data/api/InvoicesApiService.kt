package com.mmedic.data.api

import com.mmedic.data.model.*
import retrofit2.http.*

interface InvoicesApiService {
    @GET("api/v1/invoices")
    suspend fun getInvoices(
        @Query("status") status: String? = null,
        @Query("search") search: String? = null,
        @Query("customerId") customerId: String? = null
    ): ApiResponse<List<InvoiceWithDetails>>

    @GET("api/v1/invoices/{id}")
    suspend fun getInvoiceById(@Path("id") id: String): ApiResponse<InvoiceWithDetails>

    @POST("api/v1/invoices")
    suspend fun createInvoice(@Body dto: CreateInvoiceDto): ApiResponse<InvoiceWithDetails>

    @POST("api/v1/invoices/{id}/void")
    suspend fun voidInvoice(
        @Path("id") id: String,
        @Body dto: VoidInvoiceDto
    ): ApiResponse<Invoice>

    @POST("api/v1/invoices/{id}/payments")
    suspend fun addPayment(
        @Path("id") id: String,
        @Body dto: CreateInvoicePaymentDto
    ): ApiResponse<InvoiceWithDetails>

    @DELETE("api/v1/invoices/{id}/payments/{paymentId}")
    suspend fun deletePayment(
        @Path("id") id: String,
        @Path("paymentId") paymentId: String
    ): ApiResponse<InvoiceWithDetails>
}
