package com.mmedic.ui.contributors

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
import com.mmedic.data.model.ContributorWithStats
import com.mmedic.data.model.DuplicateContributorGroup
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@Composable
fun ContributorDuplicatesSection(
    duplicates: List<DuplicateContributorGroup>,
    isLoading: Boolean,
    onRefresh: () -> Unit,
    onMerge: (primaryId: String, secondaryId: String) -> Unit
) {
    var selectedGroup by remember { mutableStateOf<DuplicateContributorGroup?>(null) }
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
                text = "Duplicados de Personal Sugeridos",
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
                        text = "Todos los profesionales y técnicos poseen perfiles únicos.",
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
                        colors = CardDefaults.cardColors(containerColor = DarkCard),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    color = Color(0xFFF59E0B).copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = "Coincidencia: ${group.matchScore}%",
                                        color = Color(0xFFF59E0B),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }

                                Text(
                                    text = "Normalizado: ${group.normalizedName}",
                                    color = Color(0xFF94A3B8),
                                    fontSize = 11.sp
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            group.contributors.forEach { contributor ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = contributor.name,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Color.White,
                                            fontSize = 14.sp
                                        )
                                        Text(
                                            text = "${contributor.code} • ${contributor.articlesCount} servicios",
                                            color = Color(0xFF94A3B8),
                                            fontSize = 12.sp
                                        )
                                    }

                                    Surface(
                                        color = if (contributor.status == "ACTIVE") Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFEF4444).copy(alpha = 0.15f),
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text(
                                            text = if (contributor.status == "ACTIVE") "Activo" else "Inactivo",
                                            color = if (contributor.status == "ACTIVE") Color(0xFF10B981) else Color(0xFFEF4444),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Button(
                                onClick = {
                                    selectedGroup = group
                                    if (group.contributors.size >= 2) {
                                        primaryId = group.contributors[0].id
                                        secondaryId = group.contributors[1].id
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706)),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.align(Alignment.End)
                            ) {
                                Text("⚡ Consolidar Perfiles", fontSize = 12.sp, color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }

    selectedGroup?.let { group ->
        AlertDialog(
            onDismissRequest = { selectedGroup = null },
            shape = RoundedCornerShape(16.dp),
            containerColor = DarkCard,
            title = {
                Text("Consolidar Perfiles Duplicados", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        "Seleccione el perfil maestro que prevalecerá:",
                        color = Color(0xFF94A3B8),
                        fontSize = 13.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text("🌟 Perfil Maestro:", color = Color(0xFF10B981), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    group.contributors.forEach { c ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(
                                selected = primaryId == c.id,
                                onClick = {
                                    primaryId = c.id
                                    if (secondaryId == c.id) {
                                        secondaryId = group.contributors.firstOrNull { it.id != c.id }?.id ?: ""
                                    }
                                }
                            )
                            Text("${c.name} (${c.code})", color = Color.White, fontSize = 13.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text("🗑️ Perfil a fusionar y eliminar:", color = Color(0xFFEF4444), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    group.contributors.forEach { c ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(
                                selected = secondaryId == c.id,
                                onClick = {
                                    secondaryId = c.id
                                    if (primaryId == c.id) {
                                        primaryId = group.contributors.firstOrNull { it.id != c.id }?.id ?: ""
                                    }
                                }
                            )
                            Text("${c.name} (${c.code})", color = Color.White, fontSize = 13.sp)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val pId = primaryId
                        val sId = secondaryId
                        selectedGroup = null
                        if (pId.isNotBlank() && sId.isNotBlank() && pId != sId) {
                            onMerge(pId, sId)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Text("Confirmar Fusión", color = Color.White)
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
