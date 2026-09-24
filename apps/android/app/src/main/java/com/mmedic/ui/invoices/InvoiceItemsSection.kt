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
import com.mmedic.data.model.Article
import com.mmedic.data.model.Entity
import com.mmedic.data.model.PriceType
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvoiceItemsSection(
    articles: List<Article>,
    entities: List<Entity>,
    items: List<DraftInvoiceItem>,
    onAddItem: (Article, Entity, PriceType, Double) -> Unit,
    onRemoveItem: (Int) -> Unit
) {
    var selectedArticle by remember { mutableStateOf<Article?>(null) }
    var selectedEntity by remember { mutableStateOf<Entity?>(null) }
    var selectedPriceType by remember { mutableStateOf(PriceType.PRICE_1) }
    var quantityInput by remember { mutableStateOf("1") }
    var articleExpanded by remember { mutableStateOf(false) }
    var entityExpanded by remember { mutableStateOf(false) }

    // Auto select first entity if available
    LaunchedEffect(entities) {
        if (selectedEntity == null && entities.isNotEmpty()) {
            selectedEntity = entities.first()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DarkCard, RoundedCornerShape(12.dp))
            .border(1.dp, Color(0xFF334155), RoundedCornerShape(12.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Detalle de Artículos y Servicios",
            color = Color.White,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold
        )

        // Dropdown Selector Artículo
        ExposedDropdownMenuBox(
            expanded = articleExpanded,
            onExpandedChange = { articleExpanded = it },
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = selectedArticle?.name ?: "Seleccione un Artículo...",
                onValueChange = {},
                readOnly = true,
                label = { Text("Artículo / Servicio", fontSize = 12.sp) },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = articleExpanded) },
                modifier = Modifier.menuAnchor().fillMaxWidth(),
                colors = itemFieldColors()
            )
            ExposedDropdownMenu(
                expanded = articleExpanded,
                onDismissRequest = { articleExpanded = false },
                modifier = Modifier.background(DarkCard)
            ) {
                articles.forEach { art ->
                    DropdownMenuItem(
                        text = {
                            Column {
                                Text(art.name, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                Text(
                                    "P1: $${art.price1} | IVA: ${if (art.appliesVat == true) "Aplica 16%" else "Exento"}",
                                    color = Color(0xFF94A3B8),
                                    fontSize = 11.sp
                                )
                            }
                        },
                        onClick = {
                            selectedArticle = art
                            articleExpanded = false
                        }
                    )
                }
            }
        }

        // Selección de Tipo de Precio (P1 - P4)
        if (selectedArticle != null) {
            val art = selectedArticle!!
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Esquema de Precio:", color = Color(0xFF94A3B8), fontSize = 12.sp)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    val p1 = art.price1
                    val p2 = art.price2 ?: p1
                    val p3 = art.price3 ?: p1
                    val p4 = art.price4 ?: p1

                    PriceChip("P1", p1, selectedPriceType == PriceType.PRICE_1) { selectedPriceType = PriceType.PRICE_1 }
                    PriceChip("P2", p2, selectedPriceType == PriceType.PRICE_2) { selectedPriceType = PriceType.PRICE_2 }
                    PriceChip("P3", p3, selectedPriceType == PriceType.PRICE_3) { selectedPriceType = PriceType.PRICE_3 }
                    PriceChip("P4", p4, selectedPriceType == PriceType.PRICE_4) { selectedPriceType = PriceType.PRICE_4 }
                }
            }
        }

        // Dropdown Colaborador / Entidad Médica
        ExposedDropdownMenuBox(
            expanded = entityExpanded,
            onExpandedChange = { entityExpanded = it },
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = selectedEntity?.name ?: "Seleccione Médico / Entidad...",
                onValueChange = {},
                readOnly = true,
                label = { Text("Entidad / Médico Asignado", fontSize = 12.sp) },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = entityExpanded) },
                modifier = Modifier.menuAnchor().fillMaxWidth(),
                colors = itemFieldColors()
            )
            ExposedDropdownMenu(
                expanded = entityExpanded,
                onDismissRequest = { entityExpanded = false },
                modifier = Modifier.background(DarkCard)
            ) {
                entities.forEach { ent ->
                    DropdownMenuItem(
                        text = { Text("${ent.name} (${ent.code})", color = Color.White, fontSize = 13.sp) },
                        onClick = {
                            selectedEntity = ent
                            entityExpanded = false
                        }
                    )
                }
            }
        }

        // Cantidad y Botón Añadir
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = quantityInput,
                onValueChange = { quantityInput = it },
                label = { Text("Cant.", fontSize = 12.sp) },
                modifier = Modifier.width(90.dp),
                singleLine = true,
                colors = itemFieldColors()
            )

            Button(
                onClick = {
                    val art = selectedArticle ?: return@Button
                    val ent = selectedEntity ?: return@Button
                    val qty = quantityInput.toDoubleOrNull() ?: 1.0
                    if (qty <= 0) return@Button
                    onAddItem(art, ent, selectedPriceType, qty)
                    selectedArticle = null
                    quantityInput = "1"
                },
                enabled = selectedArticle != null && selectedEntity != null,
                modifier = Modifier.weight(1f).height(50.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary)
            ) {
                Text("+ Agregar", fontWeight = FontWeight.Bold, color = Color.White)
            }
        }

        // Lista de items agregados
        if (items.isNotEmpty()) {
            HorizontalDivider(color = Color(0xFF334155))
            Text("Items en la Factura (${items.size}):", color = Color(0xFF94A3B8), fontSize = 12.sp)

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items.forEachIndexed { idx, itm ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF0F172A), RoundedCornerShape(8.dp))
                            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(8.dp))
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(itm.article.name, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Text(
                                "Médico: ${itm.entity.name} | Cant: ${itm.quantity} x $${itm.basePrice}",
                                color = Color(0xFF94A3B8),
                                fontSize = 11.sp
                            )
                            Text(
                                "Base: $${itm.basePrice} | IVA: $${itm.vatAmount} | Subtot: $${itm.subtotal}",
                                color = Color(0xFF38BDF8),
                                fontSize = 11.sp
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                "$${String.format(java.util.Locale.US, "%.3f", itm.total)}",
                                color = Color(0xFF34D399),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            IconButton(
                                onClick = { onRemoveItem(idx) },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Text("✕", color = Color(0xFFEF4444), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RowScope.PriceChip(label: String, price: Double, selected: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Text("$$price", fontSize = 11.sp)
            }
        },
        modifier = Modifier.weight(1f),
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = DarkPrimary,
            selectedLabelColor = Color.White,
            containerColor = Color(0xFF1E293B),
            labelColor = Color(0xFF94A3B8)
        )
    )
}

@Composable
private fun itemFieldColors(): TextFieldColors {
    return OutlinedTextFieldDefaults.colors(
        focusedTextColor = Color.White,
        unfocusedTextColor = Color.White,
        focusedBorderColor = DarkPrimary,
        unfocusedBorderColor = Color(0xFF334155),
        focusedLabelColor = DarkPrimary,
        unfocusedLabelColor = Color(0xFF94A3B8)
    )
}
