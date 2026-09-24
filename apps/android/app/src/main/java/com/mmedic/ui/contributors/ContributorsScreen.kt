package com.mmedic.ui.contributors

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
import com.mmedic.data.model.ContributorWithStats
import com.mmedic.ui.common.NotificationManager
import com.mmedic.ui.theme.DarkBackground
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary
import com.mmedic.ui.theme.DarkSurface

@Composable
fun ContributorsScreen(
    viewModel: ContributorsViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }

    var showFormDialog by remember { mutableStateOf(false) }
    var contributorToEdit by remember { mutableStateOf<ContributorWithStats?>(null) }
    var contributorToDelete by remember { mutableStateOf<ContributorWithStats?>(null) }

    Scaffold(
        topBar = {
            Surface(color = DarkSurface, shadowElevation = 4.dp) {
                Column {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Personal y Colaboradores",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    TabRow(
                        selectedTabIndex = selectedTab,
                        containerColor = DarkSurface,
                        contentColor = DarkPrimary
                    ) {
                        Tab(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0 },
                            text = { Text("Personal", fontSize = 13.sp) }
                        )
                        Tab(
                            selected = selectedTab == 1,
                            onClick = {
                                selectedTab = 1
                                viewModel.loadDuplicates()
                            },
                            text = { Text("Duplicados", fontSize = 13.sp) }
                        )
                    }
                }
            }
        },
        floatingActionButton = {
            if (selectedTab == 0) {
                FloatingActionButton(
                    onClick = {
                        contributorToEdit = null
                        showFormDialog = true
                    },
                    containerColor = DarkPrimary,
                    contentColor = Color.White
                ) {
                    Text("+", fontSize = 24.sp, fontWeight = FontWeight.Bold)
                }
            }
        },
        containerColor = DarkBackground
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (selectedTab == 0) {
                ContributorsListSection(
                    contributors = uiState.filteredContributors,
                    isLoading = uiState.isLoading,
                    searchQuery = uiState.searchQuery,
                    onSearchChange = { viewModel.setSearchQuery(it) },
                    selectedStatus = uiState.selectedStatus,
                    onStatusSelect = { viewModel.setSelectedStatus(it) },
                    onEditContributor = {
                        contributorToEdit = it
                        showFormDialog = true
                    },
                    onPromptDelete = { contributorToDelete = it }
                )
            } else {
                ContributorDuplicatesSection(
                    duplicates = uiState.duplicates,
                    isLoading = uiState.isLoadingDuplicates,
                    onRefresh = { viewModel.loadDuplicates() },
                    onMerge = { primaryId, secondaryId ->
                        viewModel.mergeContributors(
                            primaryId = primaryId,
                            secondaryId = secondaryId,
                            onSuccess = {
                                NotificationManager.showSuccess("Fusión Exitosa", "Colaboradores fusionados exitosamente")
                            },
                            onError = { err ->
                                NotificationManager.showError("Error de Fusión", err)
                            }
                        )
                    }
                )
            }
        }
    }

    if (showFormDialog) {
        ContributorFormDialog(
            contributorToEdit = contributorToEdit,
            onDismiss = {
                showFormDialog = false
                contributorToEdit = null
            },
            onConfirm = { code, name, status ->
                val isEditing = contributorToEdit != null
                if (isEditing) {
                    viewModel.updateContributor(
                        id = contributorToEdit!!.id,
                        code = code,
                        name = name,
                        status = status,
                        onSuccess = {
                            NotificationManager.showSuccess("Colaborador Actualizado", "Colaborador '$name' actualizado exitosamente")
                            // Retención de pantalla/diálogo según Constitución v2.6.0
                        },
                        onError = { err ->
                            NotificationManager.showError("Error al Actualizar", err)
                        }
                    )
                } else {
                    viewModel.createContributor(
                        code = code,
                        name = name,
                        status = status,
                        onSuccess = {
                            NotificationManager.showSuccess("Colaborador Creado", "Colaborador '$name' registrado exitosamente")
                            showFormDialog = false
                            contributorToEdit = null
                        },
                        onError = { err ->
                            NotificationManager.showError("Error al Guardar", err)
                        }
                    )
                }
            }
        )
    }

    contributorToDelete?.let { contributor ->
        AlertDialog(
            onDismissRequest = { contributorToDelete = null },
            shape = RoundedCornerShape(16.dp),
            containerColor = DarkCard,
            title = {
                Text(
                    text = "Confirmar Eliminación",
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFEF4444)
                )
            },
            text = {
                Text(
                    text = "¿Está seguro de eliminar permanentemente al colaborador '${contributor.name}' (${contributor.code})? Se ha verificado que posee 0 registros asociados.",
                    color = Color.White,
                    fontSize = 14.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val target = contributor
                        contributorToDelete = null
                        viewModel.deleteContributor(
                            target,
                            onSuccess = {
                                NotificationManager.showSuccess("Colaborador Eliminado", "Colaborador '${target.name}' eliminado")
                            },
                            onError = { err ->
                                NotificationManager.showError("Error al Eliminar", err)
                            }
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                ) {
                    Text("Eliminar", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { contributorToDelete = null }) {
                    Text("Cancelar", color = Color(0xFF94A3B8))
                }
            }
        )
    }
}
