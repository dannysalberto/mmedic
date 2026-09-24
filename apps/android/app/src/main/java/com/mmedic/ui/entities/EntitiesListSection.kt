package com.mmedic.ui.entities

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.EntityWithStats
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@Composable
fun EntitiesListSection(
    entities: List<EntityWithStats>,
    isLoading: Boolean,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    selectedStatus: String,
    onStatusSelect: (String) -> Unit,
    onEditEntity: (EntityWithStats) -> Unit,
    onPromptDelete: (EntityWithStats) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Search bar & status filter
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchChange,
            placeholder = { Text("Buscar por código o nombre...") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(10.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = selectedStatus == "all",
                onClick = { onStatusSelect("all") },
                label = { Text("Todos") }
            )
            FilterChip(
                selected = selectedStatus == "ACTIVE",
                onClick = { onStatusSelect("ACTIVE") },
                label = { Text("Activos") }
            )
            FilterChip(
                selected = selectedStatus == "INACTIVE",
                onClick = { onStatusSelect("INACTIVE") },
                label = { Text("Inactivos") }
            )
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
        } else if (entities.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No se encontraron entidades colaboradoras",
                    color = Color(0xFF94A3B8),
                    fontSize = 14.sp
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(entities, key = { it.id }) { entity ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkCard)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(DarkPrimary.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = entity.name.take(2).uppercase(),
                                    color = DarkPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = entity.code,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF94A3B8),
                                        modifier = Modifier
                                            .background(Color(0xFF1E293B), RoundedCornerShape(4.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "${entity.articlesCount} art.",
                                        fontSize = 11.sp,
                                        color = DarkPrimary,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Text(
                                    text = entity.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }

                            Row {
                                TextButton(onClick = { onEditEntity(entity) }) {
                                    Text("✏️", fontSize = 16.sp)
                                }

                                TextButton(
                                    onClick = { onPromptDelete(entity) },
                                    enabled = entity.articlesCount == 0
                                ) {
                                    Text(
                                        text = "🗑️",
                                        fontSize = 16.sp,
                                        color = if (entity.articlesCount == 0) MaterialTheme.colorScheme.error else Color.Gray
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
