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
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@Composable
fun ContributorFormDialog(
    contributorToEdit: ContributorWithStats? = null,
    onDismiss: () -> Unit,
    onConfirm: (code: String, name: String, status: String) -> Unit
) {
    var code by remember { mutableStateOf(contributorToEdit?.code ?: "") }
    var name by remember { mutableStateOf(contributorToEdit?.name ?: "") }
    var status by remember { mutableStateOf(contributorToEdit?.status ?: "ACTIVE") }
    var isSaving by remember { mutableStateOf(false) }

    val isEditMode = contributorToEdit != null
    val canConfirm = code.isNotBlank() && name.isNotBlank() && !isSaving

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(16.dp),
        containerColor = DarkCard,
        title = {
            Text(
                text = if (isEditMode) "Editar Colaborador / Profesional" else "Nuevo Colaborador / Profesional",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = code,
                    onValueChange = { code = it.uppercase() },
                    label = { Text("Código / Matrícula *") },
                    placeholder = { Text("Ej: MED-001") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nombre y Especialidad *") },
                    placeholder = { Text("Ej: Dr. Roberto Mendoza") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text("Estado:", fontSize = 12.sp, color = Color(0xFF94A3B8))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(
                        selected = status == "ACTIVE",
                        onClick = { status = "ACTIVE" }
                    )
                    Text("Activo", color = Color.White, fontSize = 13.sp)

                    Spacer(modifier = Modifier.width(16.dp))

                    RadioButton(
                        selected = status == "INACTIVE",
                        onClick = { status = "INACTIVE" }
                    )
                    Text("Inactivo", color = Color.White, fontSize = 13.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    isSaving = true
                    onConfirm(code.trim(), name.trim(), status)
                },
                enabled = canConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary)
            ) {
                if (isSaving) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text(if (isEditMode) "Guardar Cambios" else "Registrar Colaborador", color = Color.White)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = Color(0xFF94A3B8))
            }
        }
    )
}
