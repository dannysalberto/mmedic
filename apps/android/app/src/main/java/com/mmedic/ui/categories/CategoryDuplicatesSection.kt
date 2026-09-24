package com.mmedic.ui.categories

import androidx.compose.foundation.background
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
import com.mmedic.data.model.DuplicateCategoryGroup
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@Composable
fun CategoryDuplicatesSection(
    duplicates: List<DuplicateCategoryGroup>,
    isLoading: Boolean,
    onRefresh: () -> Unit,
    onMerge: (primaryId: String, secondaryId: String) -> Unit
) {
    var selectedGroup by remember { mutableStateOf<DuplicateCategoryGroup?>(null) }
    var primaryId by remember { mutableStateOf("") }
    var secondaryId by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Duplicados Sugeridos",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Button(
                onClick = onRefresh,
                colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("⚡ Analizar", fontSize = 12.sp)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = DarkPrimary)
            }
        } else if (duplicates.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = DarkCard)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("✨", fontSize = 32.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "¡Sin duplicados detectados!",
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Todas las categorías poseen nombres únicos y diferenciados.",
                        color = Color(0xFF94A3B8),
                        fontSize = 13.sp
                    )
                }
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(duplicates, key = { it.normalizedName }) { group ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkCard)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Coincidencia ~${group.matchScore}%",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFF59E0B),
                                    modifier = Modifier
                                        .background(Color(0xFF78350F).copy(alpha = 0.4f), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                )

                                Button(
                                    onClick = {
                                        selectedGroup = group
                                        if (group.categories.size >= 2) {
                                            primaryId = group.categories[0].id
                                            secondaryId = group.categories[1].id
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary),
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text("🔗 Fusionar", fontSize = 12.sp)
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            group.categories.forEach { category ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = category.name,
                                        fontSize = 14.sp,
                                        color = Color.White,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "${category.articlesCount} art.",
                                        fontSize = 12.sp,
                                        color = DarkPrimary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Merge Dialog
    selectedGroup?.let { group ->
        AlertDialog(
            onDismissRequest = { selectedGroup = null },
            title = { Text("Consolidación de Categorías", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(
                        text = "Seleccione la categoría principal que conservará los datos y la secundaria que se eliminará tras reasignar sus artículos.",
                        fontSize = 12.sp,
                        color = Color(0xFF94A3B8)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Text("Categoría Principal (Conservar):", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = DarkPrimary)
                    group.categories.forEach { c ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp)
                        ) {
                            RadioButton(selected = primaryId == c.id, onClick = { primaryId = c.id })
                            Text(c.name, fontSize = 13.sp, color = Color.White)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text("Categoría Secundaria (Eliminar):", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error)
                    group.categories.forEach { c ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp)
                        ) {
                            RadioButton(selected = secondaryId == c.id, onClick = { secondaryId = c.id })
                            Text(c.name, fontSize = 13.sp, color = Color.White)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onMerge(primaryId, secondaryId)
                        selectedGroup = null
                    },
                    enabled = primaryId.isNotBlank() && secondaryId.isNotBlank() && primaryId != secondaryId,
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Fusionar", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedGroup = null }) {
                    Text("Cancelar", color = Color(0xFF94A3B8))
                }
            }
        )
    }
}
