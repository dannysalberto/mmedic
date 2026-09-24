package com.mmedic.ui.common

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex

@Composable
fun NotificationPushBanner(
    modifier: Modifier = Modifier
) {
    val notification by NotificationManager.currentNotification.collectAsState()

    Box(
        modifier = modifier
            .fillMaxWidth()
            .zIndex(9999f)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        contentAlignment = Alignment.TopCenter
    ) {
        AnimatedVisibility(
            visible = notification != null,
            enter = slideInVertically(
                initialOffsetY = { -it },
                animationSpec = tween(durationMillis = 280)
            ) + fadeIn(animationSpec = tween(durationMillis = 280)),
            exit = slideOutVertically(
                targetOffsetY = { -it },
                animationSpec = tween(durationMillis = 220)
            ) + fadeOut(animationSpec = tween(durationMillis = 220))
        ) {
            notification?.let { notif ->
                val (accentColor, iconChar) = when (notif.type) {
                    NotificationType.SUCCESS -> Pair(Color(0xFF10B981), "✓")
                    NotificationType.ERROR -> Pair(Color(0xFFEF4444), "✕")
                    NotificationType.WARNING -> Pair(Color(0xFFF59E0B), "!")
                    NotificationType.INFO -> Pair(Color(0xFF3B82F6), "ℹ")
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(elevation = 12.dp, shape = RoundedCornerShape(14.dp))
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFF1E293B))
                        .border(1.dp, Color(0xFF334155), RoundedCornerShape(14.dp))
                        .border(
                            width = 3.dp,
                            color = accentColor,
                            shape = RoundedCornerShape(topStart = 14.dp, bottomStart = 14.dp)
                        )
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Icon circle
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(accentColor.copy(alpha = 0.18f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = iconChar,
                            color = accentColor,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    // Title & Message
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = notif.title,
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = notif.message,
                            color = Color(0xFF94A3B8),
                            fontSize = 12.sp,
                            lineHeight = 16.sp
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    // Dismiss Button
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .clickable { NotificationManager.dismiss() },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "✕",
                            color = Color(0xFF64748B),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
