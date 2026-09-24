package com.mmedic.ui.invoices

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.InvoiceStatus
import com.mmedic.data.model.InvoiceType
import com.mmedic.data.model.InvoiceWithDetails
import com.mmedic.ui.theme.DarkPrimary
import com.mmedic.ui.theme.DarkSurface

@Composable
fun InvoicePreviewDialog(
    invoice: InvoiceWithDetails,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val bcvRate = 36.50 // Tasa referencial oficial
    val totalBs = invoice.total * bcvRate

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Comprobante Fiscal", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text(invoice.invoiceNumber, color = DarkPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
                StatusBadge(invoice.status)
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Info Clínica
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF0F172A), RoundedCornerShape(8.dp))
                        .padding(8.dp)
                ) {
                    Text("MMedic - Clínica Central", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Text("RIF: J-50123456-7 | Fecha: ${invoice.issueDate.take(16).replace("T", " ")}", color = Color(0xFF94A3B8), fontSize = 11.sp)
                }

                // Info Cliente
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF0F172A), RoundedCornerShape(8.dp))
                        .padding(8.dp)
                ) {
                    Text("Datos del Cliente / Paciente:", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    Text("Razón Social: ${invoice.customer.name}", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Text("RIF / CI: ${invoice.customer.taxId}", color = Color(0xFFCBD5E1), fontSize = 11.sp)
                    Text("Teléfono: ${invoice.customer.phone} | Dir: ${invoice.customer.address}", color = Color(0xFF94A3B8), fontSize = 11.sp)
                    Text("Condición: ${if (invoice.type == InvoiceType.CASH) "Contado" else "Crédito"}", color = Color(0xFFF59E0B), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }

                // Items list
                Text("Detalle de Conceptos Facturados:", color = Color(0xFF94A3B8), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    invoice.items.forEach { itm ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFF1E293B), RoundedCornerShape(6.dp))
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(itm.article?.name ?: "Servicio", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text("Médico: ${itm.entity?.name ?: "Clínica"} | Cant: ${itm.quantity} x $${itm.basePrice}", color = Color(0xFF94A3B8), fontSize = 10.sp)
                                if (itm.vatAmount > 0) {
                                    Text("IVA 16%: $${itm.vatAmount}", color = Color(0xFF38BDF8), fontSize = 10.sp)
                                }
                            }
                            Text(
                                "$${String.format(java.util.Locale.US, "%.3f", itm.total)}",
                                color = Color(0xFF34D399),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Totales
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF0F172A), RoundedCornerShape(8.dp))
                        .border(1.dp, Color(0xFF334155), RoundedCornerShape(8.dp))
                        .padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    TotalLine("Subtotal Base:", "$${String.format(java.util.Locale.US, "%.3f", invoice.subtotal)}")
                    TotalLine("IVA (16%):", "$${String.format(java.util.Locale.US, "%.3f", invoice.vatAmount)}")
                    HorizontalDivider(color = Color(0xFF334155))
                    TotalLine("TOTAL FACTURA ($):", "$${String.format(java.util.Locale.US, "%.3f", invoice.total)}", isBold = true, color = Color(0xFF38BDF8))
                    TotalLine("TOTAL ESTIMADO (Bs):", "Bs ${String.format(java.util.Locale.US, "%.2f", totalBs)}", isBold = true, color = Color(0xFF34D399))
                    TotalLine("Total Pagado ($):", "$${String.format(java.util.Locale.US, "%.3f", invoice.totalPaid)}")
                    TotalLine("Saldo Pendiente ($):", "$${String.format(java.util.Locale.US, "%.3f", invoice.balanceDue)}", isBold = true, color = if (invoice.balanceDue > 0) Color(0xFFF59E0B) else Color(0xFF10B981))
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val shareText = "Factura ${invoice.invoiceNumber}\nCliente: ${invoice.customer.name}\nTotal: $${invoice.total} (Bs ${String.format(java.util.Locale.US, "%.2f", totalBs)})\nEstado: ${invoice.status.name}\nMMedic Clínica Central"
                    val intent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, shareText)
                    }
                    context.startActivity(Intent.createChooser(intent, "Compartir Factura"))
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Compartir", color = Color.White, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cerrar", color = Color(0xFF94A3B8))
            }
        }
    )
}

@Composable
private fun TotalLine(label: String, value: String, isBold: Boolean = false, color: Color = Color.White) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = if (isBold) Color.White else Color(0xFF94A3B8), fontSize = 12.sp, fontWeight = if (isBold) FontWeight.Bold else FontWeight.Normal)
        Text(value, color = color, fontSize = 12.sp, fontWeight = if (isBold) FontWeight.Bold else FontWeight.Normal)
    }
}

@Composable
fun StatusBadge(status: InvoiceStatus) {
    val (bgColor, textColor, label) = when (status) {
        InvoiceStatus.PENDING -> Triple(Color(0x33F59E0B), Color(0xFFF59E0B), "PENDIENTE")
        InvoiceStatus.PAID -> Triple(Color(0x3310B981), Color(0xFF10B981), "PAGADA")
        InvoiceStatus.VOIDED -> Triple(Color(0x33EF4444), Color(0xFFEF4444), "ANULADA")
    }
    Surface(color = bgColor, shape = RoundedCornerShape(6.dp)) {
        Text(label, color = textColor, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
    }
}
