package com.mmedic.ui.customers

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.Customer
import com.mmedic.ui.common.NotificationManager
import com.mmedic.ui.theme.DarkBackground
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary
import com.mmedic.ui.theme.DarkSurface

@Composable
fun CustomersScreen(
    viewModel: CustomersViewModel
) {
    val uiState by viewModel.uiState.collectAsState()

    var showFormDialog by remember { mutableStateOf(false) }
    var customerToEdit by remember { mutableStateOf<Customer?>(null) }
    var customerToDelete by remember { mutableStateOf<Customer?>(null) }

    Scaffold(
        topBar = {
            Surface(color = DarkSurface, shadowElevation = 4.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Directorio de Pacientes / Clientes",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    customerToEdit = null
                    showFormDialog = true
                },
                containerColor = DarkPrimary,
                contentColor = Color.White
            ) {
                Text("+", fontSize = 24.sp, fontWeight = FontWeight.Bold)
            }
        },
        containerColor = DarkBackground
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            // Search Input
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.setSearchQuery(it) },
                label = { Text("Buscar por Cédula/RIF, nombre o teléfono...") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (uiState.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = DarkPrimary)
                }
            } else if (uiState.customers.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("👤", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "No se encontraron clientes o pacientes",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            "Intenta ajustar la búsqueda o añade uno nuevo.",
                            color = Color(0xFF94A3B8),
                            fontSize = 14.sp
                        )
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(uiState.customers, key = { it.id }) { customer ->
                        CustomerItemCard(
                            customer = customer,
                            onEdit = {
                                customerToEdit = customer
                                showFormDialog = true
                            },
                            onDelete = {
                                customerToDelete = customer
                            }
                        )
                    }
                }
            }
        }
    }

    if (showFormDialog) {
        CustomerFormDialog(
            customerToEdit = customerToEdit,
            onDismiss = {
                showFormDialog = false
                customerToEdit = null
            },
            onConfirm = { taxId, name, phone, email, address ->
                val isEditing = customerToEdit != null
                if (isEditing) {
                    viewModel.updateCustomer(
                        id = customerToEdit!!.id,
                        taxId = taxId,
                        name = name,
                        phone = phone,
                        email = email,
                        address = address,
                        onSuccess = {
                            NotificationManager.showSuccess(
                                "Cliente Actualizado",
                                "Cliente '$name' actualizado exitosamente."
                            )
                            // Retention on edit screen (Principle V, Section 5.4)
                        },
                        onError = { err ->
                            NotificationManager.showError("Error al Actualizar", err)
                        }
                    )
                } else {
                    viewModel.createCustomer(
                        taxId = taxId,
                        name = name,
                        phone = phone,
                        email = email,
                        address = address,
                        onSuccess = {
                            NotificationManager.showSuccess(
                                "Cliente Registrado",
                                "Cliente '$name' registrado exitosamente."
                            )
                            showFormDialog = false
                            customerToEdit = null
                        },
                        onError = { err ->
                            NotificationManager.showError("Error al Guardar", err)
                        }
                    )
                }
            }
        )
    }

    customerToDelete?.let { customer ->
        AlertDialog(
            onDismissRequest = { customerToDelete = null },
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
                    text = "¿Está seguro de eliminar permanentemente al cliente '${customer.name}' (${customer.taxId})? Se verificará que no posea facturas vinculadas.",
                    color = Color.White,
                    fontSize = 14.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val target = customer
                        customerToDelete = null
                        viewModel.deleteCustomer(
                            id = target.id,
                            onSuccess = {
                                NotificationManager.showSuccess(
                                    "Cliente Eliminado",
                                    "El cliente '${target.name}' ha sido eliminado."
                                )
                            },
                            onError = { err ->
                                NotificationManager.showError("Eliminación Bloqueada", err)
                            }
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                ) {
                    Text("Eliminar", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { customerToDelete = null }) {
                    Text("Cancelar", color = Color(0xFF94A3B8))
                }
            }
        )
    }
}

@Composable
private fun CustomerItemCard(
    customer: Customer,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCard),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(Color(0x260EA5E9), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = customer.name.take(2).uppercase(),
                    color = DarkPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = customer.name,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        color = Color(0x260EA5E9),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = customer.taxId,
                            color = DarkPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(2.dp))
                if (!customer.phone.isNull_or_blank()) {
                    Text("📞 ${customer.phone}", color = Color(0xFF94A3B8), fontSize = 12.sp)
                }
                if (!customer.email.isNull_or_blank()) {
                    Text("✉️ ${customer.email}", color = Color(0xFF94A3B8), fontSize = 12.sp)
                }
            }

            IconButton(onClick = onEdit) {
                Text("✏️", fontSize = 16.sp)
            }
            IconButton(onClick = onDelete) {
                Text("🗑️", fontSize = 16.sp)
            }
        }
    }
}

private fun String?.isNull_or_blank(): Boolean {
    return this.isNullOrBlank()
}
