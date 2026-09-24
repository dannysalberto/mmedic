package com.mmedic.ui.articles

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@Composable
fun ArticlePricesSection(
    price1Str: String,
    onPrice1Change: (String) -> Unit,
    price2Str: String,
    onPrice2Change: (String) -> Unit,
    price3Str: String,
    onPrice3Change: (String) -> Unit,
    price4Str: String,
    onPrice4Change: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCard)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Esquema de Precios (Hasta 4 opciones)",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = DarkPrimary
            )
            Text(
                text = "El Precio 1 es la tarifa base obligatoria. Los demás son opcionales.",
                fontSize = 12.sp,
                color = Color(0xFF94A3B8),
                modifier = Modifier.padding(top = 2.dp, bottom = 12.dp)
            )

            Row(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = price1Str,
                    onValueChange = onPrice1Change,
                    label = { Text("Precio 1 (Base) *") },
                    placeholder = { Text("0.00") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(8.dp))
                OutlinedTextField(
                    value = price2Str,
                    onValueChange = onPrice2Change,
                    label = { Text("Precio 2 (Opc.)") },
                    placeholder = { Text("0.00") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = price3Str,
                    onValueChange = onPrice3Change,
                    label = { Text("Precio 3 (Opc.)") },
                    placeholder = { Text("0.00") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(8.dp))
                OutlinedTextField(
                    value = price4Str,
                    onValueChange = onPrice4Change,
                    label = { Text("Precio 4 (Opc.)") },
                    placeholder = { Text("0.00") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}
