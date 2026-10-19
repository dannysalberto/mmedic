package com.mmedic.ui.articles

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import com.mmedic.data.model.ArticleCategory
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@Composable
fun ArticleBasicInfoSection(
    code: String,
    onCodeChange: (String) -> Unit,
    name: String,
    onNameChange: (String) -> Unit,
    categories: List<ArticleCategory>,
    selectedCategoryId: String?,
    onCategorySelect: (String) -> Unit,
    onOpenNewCategoryDialog: () -> Unit,
    onSearchCodeClick: () -> Unit = {},
    isEditMode: Boolean = false,
    appliesVat: Boolean = false,
    onAppliesVatChange: (Boolean) -> Unit = {}
) {
    var categoryDropdownExpanded by remember { mutableStateOf(false) }
    val selectedCategory = categories.find { it.id == selectedCategoryId }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCard)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Información Principal",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = DarkPrimary
                )
                if (isEditMode) {
                    Surface(
                        color = Color(0xFF6B21A8).copy(alpha = 0.3f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFA855F7)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = "Modo Edición",
                            color = Color(0xFFD8B4FE),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 1. CATEGORÍA PRIMERO
            Text(
                text = "Categoría *",
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFF94A3B8),
                modifier = Modifier.padding(bottom = 4.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .border(1.dp, Color(0xFF374151), RoundedCornerShape(8.dp))
                        .background(Color(0xFF111827), RoundedCornerShape(8.dp))
                        .clickable { categoryDropdownExpanded = true }
                        .padding(horizontal = 12.dp, vertical = 14.dp)
                ) {
                    Text(
                        text = selectedCategory?.let { "${it.name} (${it.seed})" } ?: "Seleccione una categoría",
                        color = if (selectedCategory != null) Color.White else Color(0xFF94A3B8),
                        fontSize = 14.sp
                    )

                    DropdownMenu(
                        expanded = categoryDropdownExpanded,
                        onDismissRequest = { categoryDropdownExpanded = false }
                    ) {
                        categories.forEach { cat ->
                            DropdownMenuItem(
                                text = { Text("${cat.name} (${cat.seed})") },
                                onClick = {
                                    onCategorySelect(cat.id)
                                    categoryDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                Button(
                    onClick = onOpenNewCategoryDialog,
                    colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("+ Nueva", fontSize = 12.sp)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // 2. CÓDIGO CON LUPA Y AUTO-SUGERENCIA
            val codePlaceholder = if (selectedCategory != null) {
                "Auto: ${selectedCategory.seed}-${String.format("%03d", selectedCategory.currentSequence + 1)}"
            } else {
                "Ej: CONS-001 (o buscar)"
            }

            OutlinedTextField(
                value = code,
                onValueChange = onCodeChange,
                label = { Text(if (isEditMode) "Código de Artículo (Existente)" else "Código de Artículo (Opcional)") },
                placeholder = { Text(codePlaceholder) },
                singleLine = true,
                trailingIcon = {
                    IconButton(onClick = onSearchCodeClick) {
                        Text("🔍", fontSize = 16.sp)
                    }
                },
                supportingText = {
                    Text(
                        text = if (isEditMode) "Artículo cargado para modificación" else "Presione 🔍 para buscar o déjelo vacío para autogenerar",
                        fontSize = 11.sp,
                        color = Color(0xFF94A3B8)
                    )
                },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            // 3. NOMBRE
            OutlinedTextField(
                value = name,
                onValueChange = onNameChange,
                label = { Text("Nombre del Artículo / Producto *") },
                placeholder = { Text("Ej: Consulta General de Medicina") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Aplica IVA (16%)",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.White
                    )
                    Text(
                        text = "Grava impuesto fiscal en facturación",
                        fontSize = 12.sp,
                        color = Color(0xFF94A3B8)
                    )
                }
                Switch(
                    checked = appliesVat,
                    onCheckedChange = onAppliesVatChange
                )
            }
        }
    }
}
