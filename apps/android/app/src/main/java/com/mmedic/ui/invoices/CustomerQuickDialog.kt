package com.mmedic.ui.invoices

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.CreateCustomerDto
import com.mmedic.data.model.Customer
import com.mmedic.ui.theme.DarkPrimary
import com.mmedic.ui.theme.DarkSurface

@Composable
fun CustomerQuickDialog(
    onDismiss: () -> Unit,
    onCustomerCreated: (Customer) -> Unit,
    onSubmit: (CreateCustomerDto, (Customer) -> Unit) -> Unit
) {
    var taxId by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        title = {
            Column {
                Text(
                    text = "Registrar Datos Fiscales",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Se asociará automáticamente a la factura actual",
                    color = Color(0xFF94A3B8),
                    fontSize = 12.sp
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (errorMsg != null) {
                    Text(
                        text = errorMsg!!,
                        color = Color(0xFFEF4444),
                        fontSize = 12.sp
                    )
                }

                OutlinedTextField(
                    value = taxId,
                    onValueChange = { taxId = it.uppercase() },
                    label = { Text("RIF / Cédula *", fontSize = 12.sp) },
                    placeholder = { Text("V-12345678 o J-12345678-0", fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = textFieldColors()
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Razón Social / Nombre Completo *", fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = textFieldColors()
                )

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Teléfono de Contacto *", fontSize = 12.sp) },
                    placeholder = { Text("+58 412 1234567", fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = textFieldColors()
                )

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Dirección Fiscal *", fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 3,
                    colors = textFieldColors()
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Correo Electrónico (Opcional)", fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = textFieldColors()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (taxId.isBlank() || name.isBlank() || phone.isBlank() || address.isBlank()) {
                        errorMsg = "RIF, Nombre, Teléfono y Dirección son obligatorios"
                        return@Button
                    }
                    val dto = CreateCustomerDto(
                        taxId = taxId.trim(),
                        name = name.trim(),
                        phone = phone.trim(),
                        address = address.trim(),
                        email = email.trim().ifBlank { null }
                    )
                    onSubmit(dto) { created ->
                        onCustomerCreated(created)
                        onDismiss()
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Guardar y Vincular", color = Color.White, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = Color(0xFF94A3B8))
            }
        }
    )
}

@Composable
private fun textFieldColors(): TextFieldColors {
    return OutlinedTextFieldDefaults.colors(
        focusedTextColor = Color.White,
        unfocusedTextColor = Color.White,
        focusedBorderColor = DarkPrimary,
        unfocusedBorderColor = Color(0xFF334155),
        focusedLabelColor = DarkPrimary,
        unfocusedLabelColor = Color(0xFF94A3B8)
    )
}
