package com.mmedic.ui.articles

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.Entity
import com.mmedic.data.model.ParticipantItemState
import com.mmedic.ui.theme.AccentGreen
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary
import com.mmedic.ui.theme.DarkSecondary

@Composable
fun ParticipantsSection(
    participants: MutableList<ParticipantItemState>,
    onOpenNewEntityDialog: () -> Unit,
    onSearchEntity: (code: String, onResult: (Entity?, String?) -> Unit) -> Unit
) {
    var searchCode by remember { mutableStateOf("") }
    var foundEntity by remember { mutableStateOf<Entity?>(null) }
    var foundPercentageStr by remember { mutableStateOf("") }
    var searchError by remember { mutableStateOf<String?>(null) }

    val totalPercentage = participants.sumOf { it.percentage }
    val isOverPercentage = totalPercentage > 100.001
    val remainingPercentage = (100.0 - totalPercentage).coerceAtLeast(0.0)

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
                    text = "Participantes y Honorarios",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = DarkPrimary
                )
                Button(
                    onClick = onOpenNewEntityDialog,
                    colors = ButtonDefaults.buttonColors(containerColor = DarkSecondary),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("+ Nueva Entidad", fontSize = 11.sp)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Percentage Indicator Box
            val progressColor = if (isOverPercentage) Color(0xFFEF4444) else AccentGreen
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isOverPercentage) Color(0x33EF4444) else Color(0x2210B981)
                )
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Total Asignado: ${String.format("%.2f", totalPercentage)}%",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = progressColor
                        )
                        Text(
                            text = if (isOverPercentage) "¡EXCESO!" else "Restante: ${String.format("%.2f", remainingPercentage)}%",
                            fontSize = 12.sp,
                            color = if (isOverPercentage) Color(0xFFEF4444) else Color(0xFF94A3B8)
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    LinearProgressIndicator(
                        progress = { (totalPercentage / 100f).toFloat().coerceIn(0f, 1f) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp),
                        color = progressColor,
                        trackColor = Color(0xFF374151)
                    )

                    if (isOverPercentage) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "⚠️ La suma de porcentajes no puede superar el 100.00%",
                            color = Color(0xFFEF4444),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Inline search participant
            Text(
                text = "Buscar participante existente por código:",
                fontSize = 12.sp,
                color = Color(0xFF94A3B8)
            )

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = searchCode,
                    onValueChange = {
                        searchCode = it.uppercase()
                        searchError = null
                    },
                    label = { Text("Código Entidad") },
                    placeholder = { Text("Ej: MED-01") },
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = {
                        if (searchCode.isNotBlank()) {
                            onSearchEntity(searchCode.trim()) { entity, err ->
                                foundEntity = entity
                                searchError = err
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Buscar")
                }
            }

            if (searchError != null) {
                Text(
                    text = searchError!!,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            // Found entity card
            foundEntity?.let { entity ->
                Spacer(modifier = Modifier.height(10.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF111827))
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(
                            text = "Encontrado: ${entity.name} (${entity.code})",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = foundPercentageStr,
                                onValueChange = { foundPercentageStr = it },
                                label = { Text("% Participación") },
                                placeholder = { Text("Ej: 30.0") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = {
                                    val p = foundPercentageStr.toDoubleOrNull() ?: 0.0
                                    if (p > 0.0) {
                                        val exists = participants.any { it.entityId == entity.id }
                                        if (!exists) {
                                            participants.add(
                                                ParticipantItemState(
                                                    entityId = entity.id,
                                                    code = entity.code,
                                                    name = entity.name,
                                                    status = entity.status,
                                                    percentage = p
                                                )
                                            )
                                            foundEntity = null
                                            searchCode = ""
                                            foundPercentageStr = ""
                                        } else {
                                            searchError = "La entidad ya fue agregada al detalle"
                                        }
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = AccentGreen),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("+ Agregar")
                            }
                        }
                    }
                }
            }

            // List of added participants
            if (participants.isNotEmpty()) {
                Spacer(modifier = Modifier.height(14.dp))
                Text(
                    text = "Participantes Asignados (${participants.size}):",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(6.dp))

                participants.forEachIndexed { index, item ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF111827))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.name,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 13.sp,
                                    color = Color.White
                                )
                                Text(
                                    text = "Código: ${item.code} • Asignado: ${item.percentage}%",
                                    fontSize = 11.sp,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                            TextButton(
                                onClick = { participants.removeAt(index) }
                            ) {
                                Text("Eliminar", color = Color(0xFFEF4444), fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
