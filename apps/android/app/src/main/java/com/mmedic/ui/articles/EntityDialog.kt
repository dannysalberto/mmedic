package com.mmedic.ui.articles

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
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@Composable
fun EntityDialog(
    onDismiss: () -> Unit,
    onConfirm: (code: String, name: String, status: String) -> Unit
) {
    var code by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var isActive by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(16.dp),
        containerColor = DarkCard,
        title = {
            Text(
                text = "Nueva Entidad Participante",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Registra un médico o entidad externa para asignar porcentajes de participación.",
                    fontSize = 12.sp,
                    color = Color(0xFF94A3B8),
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                OutlinedTextField(
                    value = code,
                    onValueChange = {
                        code = it.uppercase()
                        if (it.isNotBlank()) error = null
                    },
                    label = { Text("Código de entidad") },
                    placeholder = { Text("Ej: DR-01, LAB-01") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        if (it.isNotBlank()) error = null
                    },
                    label = { Text("Nombre o Razón Social") },
                    placeholder = { Text("Ej: Dr. Pérez / Lab Central") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = if (isActive) "Estatus: Activo" else "Estatus: Inactivo",
                        fontSize = 14.sp,
                        color = Color.White
                    )
                    Switch(
                        checked = isActive,
                        onCheckedChange = { isActive = it }
                    )
                }

                if (error != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = error!!,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (code.isBlank() || name.isBlank()) {
                        error = "El código y el nombre son obligatorios"
                    } else {
                        val statusStr = if (isActive) "ACTIVE" else "INACTIVE"
                        onConfirm(code.trim(), name.trim(), statusStr)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary)
            ) {
                Text("Guardar Entidad", color = Color.White)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = Color(0xFF94A3B8))
            }
        }
    )
}
