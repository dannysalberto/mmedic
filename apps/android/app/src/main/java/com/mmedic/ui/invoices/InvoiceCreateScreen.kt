package com.mmedic.ui.invoices

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.InvoiceType
import com.mmedic.ui.theme.DarkBackground
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvoiceCreateScreen(
    viewModel: InvoicesViewModel,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showCustomerDialog by remember { mutableStateOf(false) }
    var customerExpanded by remember { mutableStateOf(false) }

    val (subtotal, vat, total) = viewModel.calculateTotals()
    val bcvRate = 36.50
    val totalBs = total * bcvRate

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nueva Factura", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Text("←", color = Color.White, fontSize = 20.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBackground)
            )
        },
        containerColor = DarkBackground
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Sección Cliente
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DarkCard, RoundedCornerShape(12.dp))
                    .border(1.dp, Color(0xFF334155), RoundedCornerShape(12.dp))
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Datos del Cliente / Fiscales", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    TextButton(onClick = { showCustomerDialog = true }) {
                        Text("+ Registrar Nuevo", color = DarkPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                // Dropdown clientes existentes
                ExposedDropdownMenuBox(
                    expanded = customerExpanded,
                    onExpandedChange = { customerExpanded = it },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = uiState.selectedCustomer?.let { "${it.name} (${it.taxId})" } ?: "Seleccionar Cliente Existente...",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Cliente", fontSize = 12.sp) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = customerExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth(),
                        colors = createFieldColors()
                    )
                    ExposedDropdownMenu(
                        expanded = customerExpanded,
                        onDismissRequest = { customerExpanded = false },
                        modifier = Modifier.background(DarkCard)
                    ) {
                        uiState.customers.forEach { c ->
                            DropdownMenuItem(
                                text = {
                                    Column {
                                        Text(c.name, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                        Text("${c.taxId} | ${c.phone}", color = Color(0xFF94A3B8), fontSize = 11.sp)
                                    }
                                },
                                onClick = {
                                    viewModel.selectCustomer(c)
                                    customerExpanded = false
                                }
                            )
                        }
                    }
                }

                if (uiState.selectedCustomer != null) {
                    val c = uiState.selectedCustomer!!
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF0F172A), RoundedCornerShape(8.dp))
                            .padding(8.dp)
                    ) {
                        Text("Dirección: ${c.address}", color = Color(0xFF94A3B8), fontSize = 11.sp)
                        Text("Teléfono: ${c.phone}", color = Color(0xFF94A3B8), fontSize = 11.sp)
                    }
                }

                // Tipo de Factura (Contado vs Crédito)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = uiState.invoiceType == InvoiceType.CASH,
                        onClick = { viewModel.setInvoiceType(InvoiceType.CASH) },
                        label = { Text("Contado", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                        modifier = Modifier.weight(1f),
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = DarkPrimary,
                            selectedLabelColor = Color.White,
                            containerColor = Color(0xFF1E293B),
                            labelColor = Color(0xFF94A3B8)
                        )
                    )
                    FilterChip(
                        selected = uiState.invoiceType == InvoiceType.CREDIT,
                        onClick = { viewModel.setInvoiceType(InvoiceType.CREDIT) },
                        label = { Text("Crédito", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                        modifier = Modifier.weight(1f),
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFFF59E0B),
                            selectedLabelColor = Color.White,
                            containerColor = Color(0xFF1E293B),
                            labelColor = Color(0xFF94A3B8)
                        )
                    )
                }
            }

            // Sección Artículos
            InvoiceItemsSection(
                articles = uiState.articles,
                entities = uiState.entities,
                items = uiState.draftItems,
                onAddItem = { art, ent, pType, qty ->
                    viewModel.addDraftItem(art, ent, pType, qty)
                },
                onRemoveItem = { idx ->
                    viewModel.removeDraftItem(idx)
                }
            )

            // Resumen de Totales
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DarkCard, RoundedCornerShape(12.dp))
                    .border(1.dp, Color(0xFF334155), RoundedCornerShape(12.dp))
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text("Resumen Económico", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Subtotal Base:", color = Color(0xFF94A3B8), fontSize = 13.sp)
                    Text("$${String.format(java.util.Locale.US, "%.3f", subtotal)}", color = Color.White, fontSize = 13.sp)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("IVA (16%):", color = Color(0xFF94A3B8), fontSize = 13.sp)
                    Text("$${String.format(java.util.Locale.US, "%.3f", vat)}", color = Color(0xFF38BDF8), fontSize = 13.sp)
                }
                HorizontalDivider(color = Color(0xFF334155))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("TOTAL FACTURA ($):", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text(
                        "$${String.format(java.util.Locale.US, "%.3f", total)}",
                        color = Color(0xFF34D399),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total Estimado (Bs):", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    Text("Bs ${String.format(java.util.Locale.US, "%.2f", totalBs)}", color = Color(0xFFCBD5E1), fontSize = 12.sp)
                }
            }

            // Sección Pagos
            InvoicePaymentSection(
                totalInvoice = total,
                draftPayments = uiState.draftPayments,
                onAddDraftPayment = { viewModel.addDraftPayment(it) },
                onRemoveDraftPayment = { viewModel.removeDraftPayment(it) }
            )

            // Botón Emitir Factura
            Button(
                onClick = {
                    viewModel.createInvoice {
                        onBack()
                    }
                },
                enabled = !uiState.isSubmitting && uiState.selectedCustomer != null && uiState.draftItems.isNotEmpty(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary)
            ) {
                if (uiState.isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                } else {
                    Text("EMITIR FACTURA FISCAL", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    if (showCustomerDialog) {
        CustomerQuickDialog(
            onDismiss = { showCustomerDialog = false },
            onCustomerCreated = { showCustomerDialog = false },
            onSubmit = { dto, onDone ->
                viewModel.createCustomerQuick(dto, onDone)
            }
        )
    }
}

@Composable
private fun createFieldColors(): TextFieldColors {
    return OutlinedTextFieldDefaults.colors(
        focusedTextColor = Color.White,
        unfocusedTextColor = Color.White,
        focusedBorderColor = DarkPrimary,
        unfocusedBorderColor = Color(0xFF334155),
        focusedLabelColor = DarkPrimary,
        unfocusedLabelColor = Color(0xFF94A3B8)
    )
}
