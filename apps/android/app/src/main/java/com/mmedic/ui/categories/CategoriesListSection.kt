package com.mmedic.ui.categories

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
import com.mmedic.data.model.CategoryWithStats
import com.mmedic.ui.theme.DarkPrimary
import com.mmedic.ui.theme.DarkSurface

// T020: CategoriesListSection — LazyColumn with search, item rows, Edit/Delete actions
@Composable
fun CategoriesListSection(
    categories: List<CategoryWithStats>,
    isLoading: Boolean,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    onEditClick: (CategoryWithStats) -> Unit,
    onDeleteClick: (CategoryWithStats) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Search field
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            placeholder = { Text("Buscar categoría...", fontSize = 14.sp) },
            singleLine = true,
            shape = RoundedCornerShape(10.dp)
        )

        when {
            isLoading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = DarkPrimary)
                }
            }
            categories.isEmpty() -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🏷️", fontSize = 40.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("No se encontraron categorías", fontWeight = FontWeight.SemiBold, color = Color.White)
                        Text("Crea una nueva categoría con el botón +", fontSize = 13.sp, color = Color.Gray)
                    }
                }
            }
            else -> {
                LazyColumn(contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp)) {
                    items(categories, key = { it.id }) { category ->
                        CategoryRowItem(
                            category = category,
                            onEditClick = { onEditClick(category) },
                            onDeleteClick = { onDeleteClick(category) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CategoryRowItem(
    category: CategoryWithStats,
    onEditClick: () -> Unit,
    onDeleteClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = DarkSurface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar circle
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(color = Color(0xFF0369A1).copy(alpha = 0.2f), shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = category.name.take(2).uppercase(),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF0284C7)
                )
            }

            Spacer(Modifier.width(12.dp))

            // Name + article count
            Column(modifier = Modifier.weight(1f)) {
                Text(category.name, fontWeight = FontWeight.SemiBold, color = Color.White, fontSize = 15.sp)
                Text(
                    "${category.articlesCount} artículo(s)",
                    fontSize = 12.sp,
                    color = if (category.articlesCount > 0) Color(0xFF0284C7) else Color.Gray
                )
            }

            // Actions
            TextButton(onClick = onEditClick) {
                Text("✏️", fontSize = 16.sp)
            }
            TextButton(
                onClick = onDeleteClick,
                enabled = true // Delete is always clickable; ViewModel handles the block
            ) {
                Text(
                    "🗑️",
                    fontSize = 16.sp,
                    color = if (category.articlesCount > 0) Color.Gray else Color(0xFFDC2626)
                )
            }
        }
    }
}
