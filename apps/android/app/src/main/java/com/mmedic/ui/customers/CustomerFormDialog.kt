package com.mmedic.ui.customers

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.Customer
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@Composable
fun CustomerFormDialog(
    customerToEdit: Customer? = null,
    onDismiss: () -> Unit,
    onConfirm: (taxId: String, name: String, phone: String?, email: String?, address: String?) -> Unit
) {
    var taxId by remember { mutableStateOf(customerToEdit?.taxId ?: "") }
    var name by remember { mutableStateOf(customerToEdit?.name ?: "") }
    var phone by remember { mutableStateOf(customerToEdit?.phone ?: "") }
    var email by remember { mutableStateOf(customerToEdit?.email ?: "") }
    var address by remember { mutableStateOf(customerToEdit?.address ?: "") }
    var isSaving by remember { mutableStateOf(false) }

    val isEditMode = customerToEdit != null
    val canConfirm = taxId.isNotBlank() && name.isNotBlank() && !isSaving

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(16.dp),
        containerColor = DarkCard,
        title = {
            Text(
                text = if (isEditMode) "Editar Cliente / Paciente" else "Nuevo Cliente / Paciente",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = taxId,
                    onValueChange = { taxId = it.uppercase() },
                    label = { Text("Cédula / RIF *") },
                    placeholder = { Text("Ej: V-12345678") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nombre / Razón Social *") },
                    placeholder = { Text("Ej: María Rodríguez") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Teléfono") },
                    placeholder = { Text("Ej: 0414-1234567") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Correo Electrónico") },
                    placeholder = { Text("Ej: paciente@correo.com") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Dirección") },
                    placeholder = { Text("Ej: Av. Principal, Edif. Centro") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    isSaving = true
                    onConfirm(taxId.trim(), name.trim(), phone.trim(), email.trim(), address.trim())
                },
                enabled = canConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary)
            ) {
                if (isSaving) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text(if (isEditMode) "Guardar Cambios" else "Registrar Cliente", color = Color.White)
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
