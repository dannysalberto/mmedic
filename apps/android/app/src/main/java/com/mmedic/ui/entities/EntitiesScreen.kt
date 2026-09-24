package com.mmedic.ui.entities

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.EntityWithStats
import com.mmedic.ui.common.NotificationManager
import com.mmedic.ui.theme.DarkBackground
import com.mmedic.ui.theme.DarkPrimary
import com.mmedic.ui.theme.DarkSurface

@Composable
fun EntitiesScreen(
    viewModel: EntitiesViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }

    var showFormDialog by remember { mutableStateOf(false) }
    var entityToEdit by remember { mutableStateOf<EntityWithStats?>(null) }
    var entityToDelete by remember { mutableStateOf<EntityWithStats?>(null) }

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
                            text = "Entidades Colaboradoras",
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
                            text = { Text("Colaboradores", fontSize = 13.sp) }
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
                        entityToEdit = null
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
                EntitiesListSection(
                    entities = uiState.filteredEntities,
                    isLoading = uiState.isLoading,
                    searchQuery = uiState.searchQuery,
                    onSearchChange = { viewModel.setSearchQuery(it) },
                    selectedStatus = uiState.selectedStatus,
                    onStatusSelect = { viewModel.setSelectedStatus(it) },
                    onEditEntity = {
                        entityToEdit = it
                        showFormDialog = true
                    },
                    onPromptDelete = { entity ->
                        if (entity.articlesCount > 0) {
                            NotificationManager.showError(
                                "Eliminación bloqueada",
                                "No se puede borrar porque está vinculado a ${entity.articlesCount} artículo(s)."
                            )
                        } else {
                            entityToDelete = entity
                        }
                    }
                )
            } else {
                EntityDuplicatesSection(
                    duplicates = uiState.duplicates,
                    isLoading = uiState.isLoadingDuplicates,
                    onRefresh = { viewModel.loadDuplicates() },
                    onMerge = { primaryId, secondaryId ->
                        viewModel.mergeEntities(
                            primaryId = primaryId,
                            secondaryId = secondaryId,
                            onSuccess = {
                                NotificationManager.showSuccess(
                                    "Entidades consolidadas",
                                    "Se han fusionado las entidades exitosamente."
                                )
                            },
                            onError = { err ->
                                NotificationManager.showError("Error de fusión", err)
                            }
                        )
                    }
                )
            }
        }
    }

    if (showFormDialog) {
        EntityFormDialog(
            entityToEdit = entityToEdit,
            onDismiss = {
                showFormDialog = false
                entityToEdit = null
            },
            onConfirm = { code, name, status ->
                val isEditing = entityToEdit != null
                if (isEditing) {
                    viewModel.updateEntity(
                        id = entityToEdit!!.id,
                        code = code,
                        name = name,
                        status = status,
                        onSuccess = {
                            NotificationManager.showSuccess(
                                "Entidad actualizada",
                                "Los datos se han actualizado correctamente."
                            )
                            // Retención en pantalla en edición (Constitución v2.6.0)
                        },
                        onError = { err ->
                            NotificationManager.showError("Error al guardar", err)
                        }
                    )
                } else {
                    viewModel.createEntity(
                        code = code,
                        name = name,
                        status = status,
                        onSuccess = {
                            NotificationManager.showSuccess(
                                "Entidad registrada",
                                "El nuevo colaborador ha sido registrado."
                            )
                            showFormDialog = false
                        },
                        onError = { err ->
                            NotificationManager.showError("Error al guardar", err)
                        }
                    )
                }
            }
        )
    }

    entityToDelete?.let { entity ->
        AlertDialog(
            onDismissRequest = { entityToDelete = null },
            title = { Text("Eliminar Entidad Colaboradora") },
            text = { Text("¿Desea eliminar a '${entity.name}' (${entity.code})? Esta acción no se puede deshacer.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteEntity(
                            id = entity.id,
                            onSuccess = {
                                NotificationManager.showSuccess("Entidad eliminada", "Se ha eliminado la entidad correctamente.")
                                entityToDelete = null
                            },
                            onError = { err ->
                                NotificationManager.showError("Error al eliminar", err)
                                entityToDelete = null
                            }
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Eliminar", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { entityToDelete = null }) {
                    Text("Cancelar", color = Color(0xFF94A3B8))
                }
            }
        )
    }
}
