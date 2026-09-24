package com.mmedic.ui.articles

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.ParticipantItemState
import com.mmedic.ui.common.NotificationManager
import com.mmedic.ui.theme.*

@Composable
fun ArticleFormScreen(
    viewModel: ArticlesViewModel,
    articleId: String? = null,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val isEditMode = articleId != null

    var code by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var selectedCategoryId by remember { mutableStateOf<String?>(null) }
    var price1Str by remember { mutableStateOf("") }
    var price2Str by remember { mutableStateOf("") }
    var price3Str by remember { mutableStateOf("") }
    var price4Str by remember { mutableStateOf("") }
    var appliesVat by remember { mutableStateOf(false) }

    val participants = remember { mutableStateListOf<ParticipantItemState>() }

    var showCategoryDialog by remember { mutableStateOf(false) }
    var showEntityDialog by remember { mutableStateOf(false) }
    var formError by remember { mutableStateOf<String?>(null) }
    var isSaving by remember { mutableStateOf(false) }

    val totalPercentage = participants.sumOf { it.percentage }
    val isOverPercentage = totalPercentage > 100.001

    val canSave = code.isNotBlank() &&
            name.isNotBlank() &&
            selectedCategoryId != null &&
            (price1Str.toDoubleOrNull() ?: -1.0) >= 0.0 &&
            !isOverPercentage &&
            !isSaving

    Scaffold(
        topBar = {
            Surface(color = DarkSurface, shadowElevation = 4.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onBack) {
                        Text("← Volver", color = DarkPrimary, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isEditMode) "Editar Artículo" else "Nuevo Artículo",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
        },
        containerColor = DarkBackground
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                ArticleBasicInfoSection(
                    code = code,
                    onCodeChange = { code = it.uppercase() },
                    name = name,
                    onNameChange = { name = it },
                    categories = uiState.categories,
                    selectedCategoryId = selectedCategoryId,
                    onCategorySelect = { selectedCategoryId = it },
                    onOpenNewCategoryDialog = { showCategoryDialog = true },
                    appliesVat = appliesVat,
                    onAppliesVatChange = { appliesVat = it }
                )
            }

            item {
                ArticlePricesSection(
                    price1Str = price1Str,
                    onPrice1Change = { price1Str = it },
                    price2Str = price2Str,
                    onPrice2Change = { price2Str = it },
                    price3Str = price3Str,
                    onPrice3Change = { price3Str = it },
                    price4Str = price4Str,
                    onPrice4Change = { price4Str = it }
                )
            }

            item {
                ParticipantsSection(
                    participants = participants,
                    onOpenNewEntityDialog = { showEntityDialog = true },
                    onSearchEntity = { codeQuery, onResult ->
                        viewModel.searchEntityByCode(codeQuery, onResult)
                    }
                )
            }

            item {
                if (formError != null) {
                    Text(
                        text = formError!!,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                }

                Button(
                    onClick = {
                        val p1 = price1Str.toDoubleOrNull() ?: 0.0
                        val p2 = price2Str.toDoubleOrNull()
                        val p3 = price3Str.toDoubleOrNull()
                        val p4 = price4Str.toDoubleOrNull()

                        isSaving = true
                        formError = null

                        if (isEditMode) {
                            viewModel.updateArticle(
                                id = articleId!!,
                                code = code.trim(),
                                name = name.trim(),
                                categoryId = selectedCategoryId!!,
                                p1 = p1,
                                p2 = p2,
                                p3 = p3,
                                p4 = p4,
                                appliesVat = appliesVat,
                                participants = participants.toList(),
                                onSuccess = {
                                    isSaving = false
                                    NotificationManager.showSuccess(
                                        "Artículo actualizado",
                                        "Los cambios se han guardado exitosamente."
                                    )
                                    // Retención en pantalla según Constitución (Sección 5.4)
                                },
                                onError = { err ->
                                    isSaving = false
                                    formError = err
                                    NotificationManager.showError("Error al actualizar", err)
                                }
                            )
                        } else {
                            viewModel.createArticle(
                                code = code.trim(),
                                name = name.trim(),
                                categoryId = selectedCategoryId!!,
                                p1 = p1,
                                p2 = p2,
                                p3 = p3,
                                p4 = p4,
                                appliesVat = appliesVat,
                                participants = participants.toList(),
                                onSuccess = {
                                    isSaving = false
                                    NotificationManager.showSuccess(
                                        "Artículo creado",
                                        "El nuevo artículo se ha registrado exitosamente."
                                    )
                                    onBack()
                                },
                                onError = { err ->
                                    isSaving = false
                                    formError = err
                                    NotificationManager.showError("Error al guardar", err)
                                }
                            )
                        }
                    },
                    enabled = canSave,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = DarkPrimary,
                        disabledContainerColor = Color(0xFF374151)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            text = if (isEditMode) "Guardar Cambios" else "Guardar Artículo",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = Color.White
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    if (showCategoryDialog) {
        CategoryDialog(
            onDismiss = { showCategoryDialog = false },
            onConfirm = { catName ->
                viewModel.createCategory(catName) { newCat ->
                    if (newCat != null) {
                        selectedCategoryId = newCat.id
                        NotificationManager.showSuccess(
                            "Categoría creada",
                            "La categoría '${newCat.name}' ha sido creada exitosamente."
                        )
                    } else {
                        NotificationManager.showError("Error", "No se pudo crear la categoría")
                    }
                    showCategoryDialog = false
                }
            }
        )
    }

    if (showEntityDialog) {
        EntityDialog(
            onDismiss = { showEntityDialog = false },
            onConfirm = { entCode, entName, entStatus ->
                viewModel.createEntity(entCode, entName, entStatus) { newEnt ->
                    if (newEnt != null) {
                        val rem = (100.0 - totalPercentage).coerceAtLeast(0.0)
                        participants.add(
                            ParticipantItemState(
                                entityId = newEnt.id,
                                code = newEnt.code,
                                name = newEnt.name,
                                status = newEnt.status,
                                percentage = if (rem > 0) rem else 0.0
                            )
                        )
                        NotificationManager.showSuccess(
                            "Médico registrado",
                            "El participante '${newEnt.name}' ha sido registrado exitosamente."
                        )
                    } else {
                        NotificationManager.showError("Error", "No se pudo registrar la entidad médica")
                    }
                    showEntityDialog = false
                }
            }
        )
    }
}
