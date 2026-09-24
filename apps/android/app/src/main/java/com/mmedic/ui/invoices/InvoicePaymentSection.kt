package com.mmedic.ui.invoices

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.CreateInvoicePaymentDto
import com.mmedic.data.model.InvoicePayment
import com.mmedic.data.model.PaymentMethod
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvoicePaymentSection(
    totalInvoice: Double,
    existingPayments: List<InvoicePayment> = emptyList(),
    draftPayments: List<CreateInvoicePaymentDto> = emptyList(),
    onAddDraftPayment: ((CreateInvoicePaymentDto) -> Unit)? = null,
    onRemoveDraftPayment: ((Int) -> Unit)? = null,
    onAddLivePayment: ((CreateInvoicePaymentDto) -> Unit)? = null,
    onDeleteLivePayment: ((String) -> Unit)? = null
) {
    var selectedMethod by remember { mutableStateOf(PaymentMethod.CASH) }
    var amountInput by remember { mutableStateOf("") }
    var receivedInput by remember { mutableStateOf("") }
    var referenceInput by remember { mutableStateOf("") }
    var methodExpanded by remember { mutableStateOf(false) }

    val isLive = onAddLivePayment != null
    val totalPaid = if (isLive) {
        existingPayments.sumOf { it.amount }
    } else {
        draftPayments.sumOf { it.amount }
    }
    val pendingBalance = maxOf(0.0, totalInvoice - totalPaid)

    val receivedAmount = receivedInput.toDoubleOrNull() ?: 0.0
    val amountToPay = amountInput.toDoubleOrNull() ?: 0.0
    val calculatedChange = if (selectedMethod == PaymentMethod.CASH && receivedAmount > amountToPay) {
        receivedAmount - amountToPay
    } else 0.0

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DarkCard, RoundedCornerShape(12.dp))
            .border(1.dp, Color(0xFF334155), RoundedCornerShape(12.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Gestión de Cobranza y Pagos", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text(
                "Resta: $${String.format(java.util.Locale.US, "%.3f", pendingBalance)}",
                color = if (pendingBalance > 0) Color(0xFFF59E0B) else Color(0xFF10B981),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
        }

        // Selector de método de pago
        ExposedDropdownMenuBox(
            expanded = methodExpanded,
            onExpandedChange = { methodExpanded = it },
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = getMethodLabel(selectedMethod),
                onValueChange = {},
                readOnly = true,
                label = { Text("Método de Pago", fontSize = 12.sp) },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = methodExpanded) },
                modifier = Modifier.menuAnchor().fillMaxWidth(),
                colors = payFieldColors()
            )
            ExposedDropdownMenu(
                expanded = methodExpanded,
                onDismissRequest = { methodExpanded = false },
                modifier = Modifier.background(DarkCard)
            ) {
                PaymentMethod.values().forEach { method ->
                    DropdownMenuItem(
                        text = { Text(getMethodLabel(method), color = Color.White, fontSize = 13.sp) },
                        onClick = {
                            selectedMethod = method
                            methodExpanded = false
                        }
                    )
                }
            }
        }

        // Monto y Monto Recibido
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = amountInput,
                onValueChange = { amountInput = it },
                label = { Text("Monto a Pagar ($)", fontSize = 12.sp) },
                modifier = Modifier.weight(1f),
                singleLine = true,
                colors = payFieldColors()
            )

            if (selectedMethod == PaymentMethod.CASH) {
                OutlinedTextField(
                    value = receivedInput,
                    onValueChange = { receivedInput = it },
                    label = { Text("Efectivo Entregado", fontSize = 12.sp) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    colors = payFieldColors()
                )
            }
        }

        // Preview del vuelto
        if (selectedMethod == PaymentMethod.CASH && calculatedChange > 0) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0x3310B981), RoundedCornerShape(8.dp))
                    .border(1.dp, Color(0xFF10B981), RoundedCornerShape(8.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Vuelto / Cambio a entregar:", color = Color.White, fontSize = 12.sp)
                Text(
                    "$${String.format(java.util.Locale.US, "%.3f", calculatedChange)}",
                    color = Color(0xFF34D399),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Referencia
        if (selectedMethod != PaymentMethod.CASH) {
            OutlinedTextField(
                value = referenceInput,
                onValueChange = { referenceInput = it },
                label = { Text("Referencia Bancaria / Lote / Hash", fontSize = 12.sp) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = payFieldColors()
            )
        }

        Button(
            onClick = {
                val amt = amountInput.toDoubleOrNull() ?: return@Button
                if (amt <= 0) return@Button
                val rec = if (selectedMethod == PaymentMethod.CASH) receivedInput.toDoubleOrNull() else null
                val chg = if (calculatedChange > 0) calculatedChange else null
                val ref = referenceInput.trim().ifBlank { null }

                val dto = CreateInvoicePaymentDto(
                    paymentMethod = selectedMethod,
                    amount = InvoicesViewModel.round3(amt),
                    receivedAmount = rec?.let { InvoicesViewModel.round3(it) },
                    changeAmount = chg?.let { InvoicesViewModel.round3(it) },
                    reference = ref
                )

                if (isLive) {
                    onAddLivePayment?.invoke(dto)
                } else {
                    onAddDraftPayment?.invoke(dto)
                }
                amountInput = ""
                receivedInput = ""
                referenceInput = ""
            },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary)
        ) {
            Text("+ Registrar Pago", fontWeight = FontWeight.Bold, color = Color.White)
        }

        // Lista de pagos
        val paymentsCount = if (isLive) existingPayments.size else draftPayments.size
        if (paymentsCount > 0) {
            HorizontalDivider(color = Color(0xFF334155))
            Text("Pagos Registrados ($paymentsCount):", color = Color(0xFF94A3B8), fontSize = 12.sp)

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                if (isLive) {
                    existingPayments.forEach { pay ->
                        PaymentRow(
                            method = pay.paymentMethod.name,
                            amount = pay.amount,
                            received = pay.receivedAmount,
                            change = pay.changeAmount,
                            reference = pay.reference,
                            onDelete = { onDeleteLivePayment?.invoke(pay.id) }
                        )
                    }
                } else {
                    draftPayments.forEachIndexed { idx, pay ->
                        PaymentRow(
                            method = pay.paymentMethod.name,
                            amount = pay.amount,
                            received = pay.receivedAmount,
                            change = pay.changeAmount,
                            reference = pay.reference,
                            onDelete = { onRemoveDraftPayment?.invoke(idx) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PaymentRow(
    method: String,
    amount: Double,
    received: Double?,
    change: Double?,
    reference: String?,
    onDelete: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF0F172A), RoundedCornerShape(8.dp))
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(8.dp))
            .padding(8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(method, color = Color(0xFF38BDF8), fontSize = 12.sp, fontWeight = FontWeight.Bold)
            if (reference != null) {
                Text("Ref: $reference", color = Color(0xFF94A3B8), fontSize = 10.sp)
            }
            if (change != null && change > 0) {
                Text("Vuelto: $${String.format(java.util.Locale.US, "%.3f", change)}", color = Color(0xFF34D399), fontSize = 10.sp)
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "$${String.format(java.util.Locale.US, "%.3f", amount)}",
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
            IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                Text("🗑️", fontSize = 12.sp)
            }
        }
    }
}

private fun getMethodLabel(method: PaymentMethod): String {
    return when (method) {
        PaymentMethod.CASH -> "Efectivo (USD / Divisa)"
        PaymentMethod.CARD -> "Punto de Venta / Tarjeta"
        PaymentMethod.CASHEA -> "Cashea"
        PaymentMethod.BINANCE -> "Binance Pay / Cripto"
        PaymentMethod.TRANSFER -> "Transferencia / Pago Móvil"
        PaymentMethod.OTHER -> "Otro Método"
    }
}

@Composable
private fun payFieldColors(): TextFieldColors {
    return OutlinedTextFieldDefaults.colors(
        focusedTextColor = Color.White,
        unfocusedTextColor = Color.White,
        focusedBorderColor = DarkPrimary,
        unfocusedBorderColor = Color(0xFF334155),
        focusedLabelColor = DarkPrimary,
        unfocusedLabelColor = Color(0xFF94A3B8)
    )
}
