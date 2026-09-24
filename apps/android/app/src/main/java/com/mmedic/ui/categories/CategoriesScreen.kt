package com.mmedic.ui.categories

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.CategoryWithStats
import com.mmedic.ui.common.NotificationManager
import com.mmedic.ui.theme.DarkBackground
import com.mmedic.ui.theme.DarkPrimary
import com.mmedic.ui.theme.DarkSurface

@Composable
fun CategoriesScreen(
    viewModel: CategoriesViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }

    var showFormDialog by remember { mutableStateOf(false) }
    var categoryToEdit by remember { mutableStateOf<CategoryWithStats?>(null) }
    var categoryToDelete by remember { mutableStateOf<CategoryWithStats?>(null) }

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
                            text = "Categorías Inmutables",
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
                            text = { Text("Categorías", fontSize = 13.sp) }
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
                        categoryToEdit = null
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
                CategoriesListSection(
                    categories = uiState.filteredCategories,
                    isLoading = uiState.isLoading,
                    searchQuery = uiState.searchQuery,
                    onSearchChange = { viewModel.search(it) },
                    onEditClick = {
                        categoryToEdit = it
                        showFormDialog = true
                    },
                    onDeleteClick = { category ->
                        if (category.articlesCount > 0) {
                            NotificationManager.showError(
                                "Eliminación bloqueada",
                                "No se puede eliminar la categoría '${category.name}' porque está vinculada a ${category.articlesCount} artículo(s). Reasigne o desasocie los artículos previamente."
                            )
                        } else {
                            categoryToDelete = category
                        }
                    }
                )
            } else {
                CategoryDuplicatesSection(
                    duplicates = uiState.duplicates,
                    isLoading = uiState.isLoadingDuplicates,
                    onRefresh = { viewModel.loadDuplicates() },
                    onMerge = { primaryId, secondaryId ->
                        viewModel.mergeCategories(
                            primaryId = primaryId,
                            secondaryId = secondaryId,
                            onSuccess = {
                                NotificationManager.showSuccess(
                                    "Categorías consolidadas",
                                    "Se han fusionado las categorías y reasignado los artículos exitosamente."
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
        CategoryFormDialog(
            categoryToEdit = categoryToEdit,
            onDismiss = {
                showFormDialog = false
                categoryToEdit = null
            },
            onConfirm = { name ->
                val isEditing = categoryToEdit != null
                if (isEditing) {
                    viewModel.updateCategory(
                        id = categoryToEdit!!.id,
                        name = name,
                        onSuccess = {
                            NotificationManager.showSuccess(
                                "Categoría actualizada",
                                "Los datos se han actualizado correctamente."
                            )
                            showFormDialog = false
                            categoryToEdit = null
                        },
                        onError = { err ->
                            NotificationManager.showError("Error al guardar", err)
                        }
                    )
                } else {
                    viewModel.createCategory(
                        name = name,
                        onSuccess = {
                            NotificationManager.showSuccess(
                                "Categoría creada",
                                "La nueva categoría ha sido registrada."
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

    categoryToDelete?.let { category ->
        AlertDialog(
            onDismissRequest = { categoryToDelete = null },
            title = { Text("Eliminar Categoría") },
            text = { Text("¿Desea eliminar la categoría '${category.name}'? Esta acción no se puede deshacer.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteCategory(
                            id = category.id,
                            onSuccess = {
                                NotificationManager.showSuccess("Categoría eliminada", "Se ha eliminado la categoría correctamente.")
                                categoryToDelete = null
                            },
                            onError = { err ->
                                NotificationManager.showError("Error al eliminar", err)
                                categoryToDelete = null
                            }
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Eliminar", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { categoryToDelete = null }) {
                    Text("Cancelar", color = Color(0xFF94A3B8))
                }
            }
        )
    }
}
