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
            Text(
                text = "Información Principal",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = DarkPrimary
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = code,
                onValueChange = onCodeChange,
                label = { Text("Código de Artículo *") },
                placeholder = { Text("Ej: CONS-001") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = name,
                onValueChange = onNameChange,
                label = { Text("Nombre del Artículo / Producto *") },
                placeholder = { Text("Ej: Consulta General de Medicina") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Categoría *",
                fontSize = 13.sp,
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
                        text = selectedCategory?.name ?: "Seleccione una categoría",
                        color = if (selectedCategory != null) Color.White else Color(0xFF94A3B8),
                        fontSize = 14.sp
                    )

                    DropdownMenu(
                        expanded = categoryDropdownExpanded,
                        onDismissRequest = { categoryDropdownExpanded = false }
                    ) {
                        categories.forEach { cat ->
                            DropdownMenuItem(
                                text = { Text(cat.name) },
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
