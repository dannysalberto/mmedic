package com.mmedic.ui.invoices

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.InvoiceStatus
import com.mmedic.data.model.InvoiceType
import com.mmedic.data.model.InvoiceWithDetails
import com.mmedic.ui.theme.DarkBackground
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvoicesScreen(
    viewModel: InvoicesViewModel,
    onNavigateToCreate: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var voidReasonInput by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Módulo de Facturación", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBackground)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToCreate,
                containerColor = DarkPrimary,
                contentColor = Color.White
            ) {
                Text("+", fontSize = 24.sp, fontWeight = FontWeight.Bold)
            }
        },
        containerColor = DarkBackground
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Buscador
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.setSearchQuery(it) },
                placeholder = { Text("Buscar por N°, RIF o Nombre...", fontSize = 12.sp) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = searchFieldColors()
            )

            // Chips Filtro Estado
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("ALL" to "Todas", "PENDING" to "Pendientes", "PAID" to "Pagadas", "VOIDED" to "Anuladas").forEach { (key, label) ->
                    FilterChip(
                        selected = uiState.selectedStatus == key,
                        onClick = { viewModel.setStatusFilter(key) },
                        label = { Text(label, fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = DarkPrimary,
                            selectedLabelColor = Color.White,
                            containerColor = Color(0xFF1E293B),
                            labelColor = Color(0xFF94A3B8)
                        )
                    )
                }
            }

            // Lista de Facturas
            if (uiState.isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = DarkPrimary)
                }
            } else if (uiState.invoices.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🧾", fontSize = 40.sp)
                        Text("No se encontraron facturas", color = Color(0xFF94A3B8), fontSize = 14.sp)
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    items(uiState.invoices, key = { it.id }) { invoice ->
                        InvoiceCard(
                            invoice = invoice,
                            onPreview = { viewModel.openPreview(invoice) },
                            onPay = { viewModel.openPaymentModal(invoice) },
                            onVoid = { viewModel.promptVoid(invoice) }
                        )
                    }
                }
            }
        }
    }

    // Modal Preview Comprobante
    if (uiState.previewInvoice != null) {
        InvoicePreviewDialog(
            invoice = uiState.previewInvoice!!,
            onDismiss = { viewModel.closePreview() }
        )
    }

    // Modal Cobranza para Factura Existente
    if (uiState.paymentInvoice != null) {
        val inv = uiState.paymentInvoice!!
        AlertDialog(
            onDismissRequest = { viewModel.closePaymentModal() },
            containerColor = DarkCard,
            title = {
                Text("Cobranza Factura ${inv.invoiceNumber}", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            },
            text = {
                InvoicePaymentSection(
                    totalInvoice = inv.total,
                    existingPayments = inv.payments,
                    onAddLivePayment = { dto -> viewModel.addPaymentToInvoice(inv.id, dto) },
                    onDeleteLivePayment = { pId -> viewModel.deletePayment(inv.id, pId) }
                )
            },
            confirmButton = {
                TextButton(onClick = { viewModel.closePaymentModal() }) {
                    Text("Cerrar", color = DarkPrimary, fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    // Modal Anular Factura
    if (uiState.voidTargetInvoice != null) {
        val inv = uiState.voidTargetInvoice!!
        AlertDialog(
            onDismissRequest = { viewModel.cancelVoid() },
            containerColor = DarkCard,
            title = { Text("Anular Factura ${inv.invoiceNumber}", color = Color(0xFFEF4444), fontSize = 16.sp, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("⚠️ Esta acción es irreversible y revertirá los estados de pago.", color = Color(0xFFFCA5A5), fontSize = 12.sp)
                    OutlinedTextField(
                        value = voidReasonInput,
                        onValueChange = { voidReasonInput = it },
                        label = { Text("Motivo de Anulación *", fontSize = 12.sp) },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        colors = searchFieldColors()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (voidReasonInput.isNotBlank()) {
                            viewModel.confirmVoid(voidReasonInput.trim())
                            voidReasonInput = ""
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Anular Factura", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.cancelVoid() }) {
                    Text("Cancelar", color = Color(0xFF94A3B8))
                }
            }
        )
    }
}

@Composable
private fun InvoiceCard(
    invoice: InvoiceWithDetails,
    onPreview: () -> Unit,
    onPay: () -> Unit,
    onVoid: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFF334155), RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = DarkCard),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(invoice.invoiceNumber, color = DarkPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                StatusBadge(invoice.status)
            }

            Text(invoice.customer.name, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Text("${invoice.customer.taxId} | ${invoice.issueDate.take(10)}", color = Color(0xFF94A3B8), fontSize = 11.sp)

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Total: $${String.format(java.util.Locale.US, "%.3f", invoice.total)}", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text(
                        "Saldo: $${String.format(java.util.Locale.US, "%.3f", invoice.balanceDue)}",
                        color = if (invoice.balanceDue > 0) Color(0xFFF59E0B) else Color(0xFF10B981),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = onPreview, modifier = Modifier.size(32.dp)) {
                        Text("👁️", fontSize = 14.sp)
                    }
                    if (invoice.status == InvoiceStatus.PENDING) {
                        IconButton(onClick = onPay, modifier = Modifier.size(32.dp)) {
                            Text("💳", fontSize = 14.sp)
                        }
                    }
                    if (invoice.status != InvoiceStatus.VOIDED) {
                        IconButton(onClick = onVoid, modifier = Modifier.size(32.dp)) {
                            Text("🚫", fontSize = 14.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun searchFieldColors(): TextFieldColors {
    return OutlinedTextFieldDefaults.colors(
        focusedTextColor = Color.White,
        unfocusedTextColor = Color.White,
        focusedBorderColor = DarkPrimary,
        unfocusedBorderColor = Color(0xFF334155),
        focusedLabelColor = DarkPrimary,
        unfocusedLabelColor = Color(0xFF94A3B8)
    )
}
