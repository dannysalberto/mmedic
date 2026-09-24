package com.mmedic.ui.server

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
import com.mmedic.data.api.ApiClient
import com.mmedic.data.model.HealthResponse
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary
import kotlinx.coroutines.launch

@Composable
fun ServerStatusScreen() {
    val coroutineScope = rememberCoroutineScope()
    var urlInput by remember { mutableStateOf(ApiClient.baseUrl) }
    var healthStatus by remember { mutableStateOf<HealthResponse?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "MMedic Mobile",
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            color = DarkPrimary
        )
        Text(
            text = "Paridad Nativa Android (Kotlin & Jetpack Compose)",
            fontSize = 13.sp,
            color = Color(0xFF94A3B8)
        )

        Spacer(modifier = Modifier.height(24.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkCard)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Configuración Servidor NestJS API",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
                Text(
                    text = "Emulador usa: http://10.0.2.2:3000/\nDispositivo físico: http://TU_IP_LOCAL:3000/",
                    fontSize = 12.sp,
                    color = Color(0xFF94A3B8),
                    modifier = Modifier.padding(vertical = 6.dp)
                )

                OutlinedTextField(
                    value = urlInput,
                    onValueChange = {
                        urlInput = it
                        ApiClient.baseUrl = it
                    },
                    label = { Text("Base URL API") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = {
                        coroutineScope.launch {
                            isLoading = true
                            errorMessage = null
                            healthStatus = null
                            try {
                                val api = ApiClient.create()
                                val response = api.checkHealth()
                                healthStatus = response
                            } catch (e: Exception) {
                                errorMessage = "Error de conexión: ${e.localizedMessage}"
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Verificando Conexión...")
                    } else {
                        Text("Probar Conexión con NestJS")
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        if (healthStatus != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF064E3B))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "✓ Conectado a la API MMedic",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF34D399)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Servicio: ${healthStatus?.service}", color = Color.White, fontSize = 13.sp)
                    Text("Versión: ${healthStatus?.version}", color = Color.White, fontSize = 13.sp)
                    Text("Base de Datos: ${healthStatus?.database}", color = Color(0xFFFBBF24), fontSize = 13.sp)
                    Text("Uptime: ${healthStatus?.uptime}s", color = Color.White, fontSize = 13.sp)
                }
            }
        }

        if (errorMessage != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF7F1D1D))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "✕ Conexión Fallida",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFF87171)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = errorMessage ?: "", color = Color.White, fontSize = 13.sp)
                }
            }
        }
    }
}
