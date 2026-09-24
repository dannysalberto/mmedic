package com.mmedic.ui.contributors

import androidx.compose.foundation.background
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
import com.mmedic.data.model.ContributorWithStats
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@Composable
fun ContributorsListSection(
    contributors: List<ContributorWithStats>,
    isLoading: Boolean,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    selectedStatus: String,
    onStatusSelect: (String) -> Unit,
    onEditContributor: (ContributorWithStats) -> Unit,
    onPromptDelete: (ContributorWithStats) -> Unit
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
            placeholder = { Text("Buscar por código, matrícula o nombre...") },
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
        } else if (contributors.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No se encontraron colaboradores registrados",
                    color = Color(0xFF94A3B8),
                    fontSize = 14.sp
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(contributors, key = { it.id }) { contributor ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DarkCard),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onEditContributor(contributor) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF1E293B)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = contributor.name.take(2).uppercase(),
                                        fontWeight = FontWeight.Bold,
                                        color = DarkPrimary,
                                        fontSize = 14.sp
                                    )
                                }

                                Column {
                                    Text(
                                        text = contributor.name,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        fontSize = 15.sp
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Text(
                                            text = contributor.code,
                                            color = DarkPrimary,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Text(
                                            text = "• ${contributor.articlesCount} servicios",
                                            color = Color(0xFF94A3B8),
                                            fontSize = 12.sp
                                        )
                                    }
                                }
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                val statusColor = if (contributor.status == "ACTIVE") Color(0xFF10B981) else Color(0xFFEF4444)
                                Surface(
                                    color = statusColor.copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = if (contributor.status == "ACTIVE") "Activo" else "Inactivo",
                                        color = statusColor,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }

                                IconButton(onClick = { onEditContributor(contributor) }) {
                                    Text("✏️", fontSize = 14.sp)
                                }

                                IconButton(
                                    onClick = { onPromptDelete(contributor) },
                                    enabled = contributor.articlesCount == 0
                                ) {
                                    Text(
                                        text = "🗑️",
                                        fontSize = 14.sp,
                                        color = if (contributor.articlesCount == 0) Color(0xFFEF4444) else Color(0xFF475569)
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
