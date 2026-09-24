package com.mmedic.ui.articles

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.data.model.Article
import com.mmedic.ui.theme.*

@Composable
fun ArticlesScreen(
    viewModel: ArticlesViewModel,
    onNavigateToCreate: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToCreate,
                containerColor = DarkPrimary,
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("+ Nuevo", fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp))
            }
        },
        containerColor = DarkBackground
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Catálogo de Artículos",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "${uiState.filteredArticles.size} productos registrados",
                        fontSize = 12.sp,
                        color = Color(0xFF94A3B8)
                    )
                }

                IconButton(onClick = { viewModel.loadArticles() }) {
                    Text("🔄", fontSize = 18.sp)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Search Bar
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.setSearchQuery(it) },
                placeholder = { Text("Buscar por código o nombre...") },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = DarkCard,
                    unfocusedContainerColor = DarkCard,
                    focusedBorderColor = DarkPrimary,
                    unfocusedBorderColor = Color(0xFF374151)
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Horizontal Category Chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = uiState.selectedCategoryId == null,
                    onClick = { viewModel.setSelectedCategory(null) },
                    label = { Text("Todas") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = DarkPrimary,
                        selectedLabelColor = Color.White
                    )
                )

                uiState.categories.forEach { cat ->
                    FilterChip(
                        selected = uiState.selectedCategoryId == cat.id,
                        onClick = {
                            viewModel.setSelectedCategory(
                                if (uiState.selectedCategoryId == cat.id) null else cat.id
                            )
                        },
                        label = { Text(cat.name) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = DarkPrimary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Error banner if any
            if (uiState.errorMessage != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0x33EF4444))
                ) {
                    Text(
                        text = uiState.errorMessage!!,
                        color = Color(0xFFEF4444),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(10.dp)
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
            }

            // Articles List
            if (uiState.isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = DarkPrimary)
                }
            } else if (uiState.filteredArticles.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📦", fontSize = 40.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "No se encontraron artículos",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Pulsa '+ Nuevo' para registrar el primero",
                            fontSize = 12.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(uiState.filteredArticles, key = { it.id }) { article ->
                        ArticleItemCard(article = article)
                    }
                    item {
                        Spacer(modifier = Modifier.height(72.dp)) // Padding for FAB
                    }
                }
            }
        }
    }
}

@Composable
fun ArticleItemCard(article: Article) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCard)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Badges row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Surface(
                        color = Color(0x330EA5E9),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = article.code,
                            color = DarkPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }

                    article.category?.let { cat ->
                        Surface(
                            color = Color(0xFF374151),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = cat.name,
                                color = Color(0xFFCBD5E1),
                                fontSize = 11.sp,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Surface(
                    color = if (article.isActive) Color(0x3310B981) else Color(0x33EF4444),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = if (article.isActive) "Activo" else "Inactivo",
                        color = if (article.isActive) AccentGreen else Color(0xFFEF4444),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Article Name
            Text(
                text = article.name,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = Color.White
            )

            Spacer(modifier = Modifier.height(10.dp))

            // 4 Prices Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                PriceBadge(label = "P1 (Base)", amount = article.price1, isBase = true)
                PriceBadge(label = "P2", amount = article.price2, isBase = false)
                PriceBadge(label = "P3", amount = article.price3, isBase = false)
                PriceBadge(label = "P4", amount = article.price4, isBase = false)
            }

            // Participants summary chip
            val count = article.participantsCount ?: article.participants?.size ?: 0
            if (count > 0) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "👥 $count participante(s) con honorarios",
                    fontSize = 11.sp,
                    color = Color(0xFF94A3B8)
                )
            }
        }
    }
}

@Composable
fun PriceBadge(label: String, amount: Double?, isBase: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = label,
            fontSize = 10.sp,
            color = Color(0xFF94A3B8)
        )
        Text(
            text = if (amount != null && amount > 0) "$${String.format("%.2f", amount)}" else "-",
            fontSize = 12.sp,
            fontWeight = if (isBase) FontWeight.Bold else FontWeight.Normal,
            color = if (isBase) AccentGreen else Color.White
        )
    }
}
