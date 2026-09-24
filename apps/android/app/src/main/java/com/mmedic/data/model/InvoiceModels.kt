package com.mmedic.data.model

enum class InvoiceType {
    CASH,
    CREDIT
}

enum class InvoiceStatus {
    PENDING,
    PAID,
    VOIDED
}

enum class PaymentMethod {
    CASH,
    CARD,
    CASHEA,
    BINANCE,
    TRANSFER,
    OTHER
}

enum class PriceType {
    PRICE_1,
    PRICE_2,
    PRICE_3,
    PRICE_4
}


data class Customer(
    val id: String,
    val tenantId: String? = null,
    val taxId: String,
    val name: String,
    val phone: String? = null,
    val address: String? = null,
    val email: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class CreateCustomerDto(
    val taxId: String,
    val name: String,
    val phone: String? = null,
    val address: String? = null,
    val email: String? = null
)

data class UpdateCustomerDto(
    val taxId: String? = null,
    val name: String? = null,
    val phone: String? = null,
    val address: String? = null,
    val email: String? = null
)

data class InvoiceItemArticle(
    val id: String? = null,
    val code: String,
    val name: String,
    val appliesVat: Boolean = false
)

data class InvoiceItemEntity(
    val id: String? = null,
    val code: String,
    val name: String
)

data class InvoiceItemParticipantNode(
    val entityId: String,
    val percentage: Double
)

data class InvoiceItem(
    val id: String,
    val tenantId: String? = null,
    val invoiceId: String? = null,
    val articleId: String,
    val contributorId: String? = null,
    val entityId: String? = null,
    val priceType: PriceType,
    val quantity: Double,
    val basePrice: Double,
    val vatAmount: Double,
    val subtotal: Double,
    val total: Double,
    val participantsJson: List<InvoiceItemParticipantNode>? = null,
    val article: InvoiceItemArticle? = null,
    val entity: InvoiceItemEntity? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class CreateInvoiceItemDto(
    val articleId: String,
    val contributorId: String? = null,
    val entityId: String? = null,
    val priceType: PriceType,
    val quantity: Double
)

data class InvoicePayment(
    val id: String,
    val tenantId: String? = null,
    val invoiceId: String? = null,
    val paymentMethod: PaymentMethod,
    val amount: Double,
    val receivedAmount: Double? = null,
    val changeAmount: Double? = null,
    val reference: String? = null,
    val paymentDate: String? = null,
    val receivedById: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class CreateInvoicePaymentDto(
    val paymentMethod: PaymentMethod,
    val amount: Double,
    val receivedAmount: Double? = null,
    val changeAmount: Double? = null,
    val reference: String? = null
)

data class Invoice(
    val id: String,
    val tenantId: String? = null,
    val invoiceNumber: String,
    val issueDate: String,
    val customerId: String,
    val type: InvoiceType,
    val status: InvoiceStatus,
    val subtotal: Double,
    val vatAmount: Double,
    val total: Double,
    val notes: String? = null,
    val createdById: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class InvoiceWithDetails(
    val id: String,
    val tenantId: String? = null,
    val invoiceNumber: String,
    val issueDate: String,
    val customerId: String,
    val type: InvoiceType,
    val status: InvoiceStatus,
    val subtotal: Double,
    val vatAmount: Double,
    val total: Double,
    val notes: String? = null,
    val createdById: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val customer: Customer,
    val items: List<InvoiceItem> = emptyList(),
    val payments: List<InvoicePayment> = emptyList(),
    val totalPaid: Double = 0.0,
    val balanceDue: Double = 0.0
)

data class CreateInvoiceDto(
    val customerId: String,
    val type: InvoiceType,
    val items: List<CreateInvoiceItemDto>,
    val payments: List<CreateInvoicePaymentDto> = emptyList(),
    val notes: String? = null
)

data class VoidInvoiceDto(
    val reason: String
)
