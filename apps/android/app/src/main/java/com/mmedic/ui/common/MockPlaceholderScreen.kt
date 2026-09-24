package com.mmedic.ui.common

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.ui.theme.DarkCard
import com.mmedic.ui.theme.DarkPrimary

@Composable
fun MockPlaceholderScreen(
    title: String,
    icon: String,
    description: String,
    onActionClick: (() -> Unit)? = null,
    actionLabel: String? = null
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = DarkCard)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(text = icon, fontSize = 48.sp)
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = title,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = description,
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8),
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )

                if (onActionClick != null && actionLabel != null) {
                    Spacer(modifier = Modifier.height(20.dp))
                    Button(
                        onClick = onActionClick,
                        colors = ButtonDefaults.buttonColors(containerColor = DarkPrimary),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(actionLabel, color = Color.White, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}
