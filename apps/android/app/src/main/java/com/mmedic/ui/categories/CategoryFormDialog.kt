package com.mmedic.ui.categories

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.CategoryWithStats
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@Composable
fun CategoryFormDialog(
    categoryToEdit: CategoryWithStats? = null,
    onDismiss: () -> Unit,
    onConfirm: (name: String) -> Unit
) {
    var name by remember { mutableStateOf(categoryToEdit?.name ?: "") }
    var isSaving by remember { mutableStateOf(false) }

    val isEditMode = categoryToEdit != null
    val canConfirm = name.isNotBlank() && !isSaving

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(16.dp),
        containerColor = DarkCard,
        title = {
            Text(
                text = if (isEditMode) "Editar Categoría" else "Nueva Categoría",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nombre de la Categoría *") },
                    placeholder = { Text("Ej: Medicamentos, Descartables...") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    isSaving = true
                    onConfirm(name.trim())
                },
                enabled = canConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary)
            ) {
                if (isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(
                        if (isEditMode) "Guardar Cambios" else "Registrar Categoría",
                        color = Color.White
                    )
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isSaving) {
                Text("Cancelar", color = Color(0xFF94A3B8))
            }
        }
    )
}
