package com.mmedic

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mmedic.ui.articles.ArticleFormScreen
import com.mmedic.ui.articles.ArticlesScreen
import com.mmedic.ui.articles.ArticlesViewModel
import com.mmedic.ui.entities.EntitiesScreen
import com.mmedic.ui.entities.EntitiesViewModel
import com.mmedic.ui.contributors.ContributorsScreen
import com.mmedic.ui.contributors.ContributorsViewModel
import com.mmedic.ui.categories.CategoriesScreen
import com.mmedic.ui.categories.CategoriesViewModel
import com.mmedic.ui.customers.CustomersScreen
import com.mmedic.ui.customers.CustomersViewModel
import com.mmedic.ui.invoices.InvoiceCreateScreen
import com.mmedic.ui.invoices.InvoicesScreen
import com.mmedic.ui.invoices.InvoicesViewModel
import com.mmedic.ui.common.MockPlaceholderScreen
import com.mmedic.ui.common.NotificationPushBanner
import com.mmedic.ui.server.ServerStatusScreen
import com.mmedic.ui.theme.DarkBackground
import com.mmedic.ui.theme.DarkPrimary
import com.mmedic.ui.theme.DarkSurface
import com.mmedic.ui.theme.MMedicTheme

enum class AppScreen {
    HOME,
    ARTICLES,
    CREATE_ARTICLE,
    INVOICES,
    CREATE_INVOICE,
    ENTITIES,
    CONTRIBUTORS,
    CATEGORIES,
    APPOINTMENTS,
    PATIENTS,
    SERVER_STATUS
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MMedicTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainAppNavigation()
                }
            }
        }
    }
}

@Composable
fun MainAppNavigation() {
    val articlesViewModel = remember { ArticlesViewModel() }
    val entitiesViewModel = remember { EntitiesViewModel() }
    val contributorsViewModel = remember { ContributorsViewModel() }
    val categoriesViewModel = remember { CategoriesViewModel() }
    val invoicesViewModel = remember { InvoicesViewModel() }
    val customersViewModel = remember { CustomersViewModel() }
    var currentScreen by remember { mutableStateOf(AppScreen.ARTICLES) }

    Scaffold(
        bottomBar = {
            if (currentScreen != AppScreen.CREATE_ARTICLE && currentScreen != AppScreen.CREATE_INVOICE) {
                NavigationBar(
                    containerColor = DarkSurface,
                    contentColor = Color.White,
                    tonalElevation = 8.dp
                ) {
                    NavigationBarItem(
                        selected = currentScreen == AppScreen.HOME,
                        onClick = { currentScreen = AppScreen.HOME },
                        label = { Text("Inicio", fontSize = 11.sp) },
                        icon = { Text("🏠", fontSize = 18.sp) },
                        colors = navItemColors()
                    )

                    NavigationBarItem(
                        selected = currentScreen == AppScreen.ARTICLES,
                        onClick = { currentScreen = AppScreen.ARTICLES },
                        label = { Text("Artículos", fontSize = 11.sp) },
                        icon = { Text("📦", fontSize = 18.sp) },
                        colors = navItemColors()
                    )

                    NavigationBarItem(
                        selected = currentScreen == AppScreen.INVOICES,
                        onClick = { currentScreen = AppScreen.INVOICES },
                        label = { Text("Facturas", fontSize = 11.sp) },
                        icon = { Text("🧾", fontSize = 18.sp) },
                        colors = navItemColors()
                    )

                    NavigationBarItem(
                        selected = currentScreen == AppScreen.ENTITIES,
                        onClick = { currentScreen = AppScreen.ENTITIES },
                        label = { Text("Entidades", fontSize = 11.sp) },
                        icon = { Text("🏥", fontSize = 18.sp) },
                        colors = navItemColors()
                    )

                    NavigationBarItem(
                        selected = currentScreen == AppScreen.CONTRIBUTORS,
                        onClick = { currentScreen = AppScreen.CONTRIBUTORS },
                        label = { Text("Personal", fontSize = 11.sp) },
                        icon = { Text("👨‍⚕️", fontSize = 18.sp) },
                        colors = navItemColors()
                    )

                    NavigationBarItem(
                        selected = currentScreen == AppScreen.CATEGORIES,
                        onClick = { currentScreen = AppScreen.CATEGORIES },
                        label = { Text("Categorías", fontSize = 11.sp) },
                        icon = { Text("🏷️", fontSize = 18.sp) },
                        colors = navItemColors()
                    )

                    NavigationBarItem(
                        selected = currentScreen == AppScreen.APPOINTMENTS,
                        onClick = { currentScreen = AppScreen.APPOINTMENTS },
                        label = { Text("Citas", fontSize = 11.sp) },
                        icon = { Text("📅", fontSize = 18.sp) },
                        colors = navItemColors()
                    )

                    NavigationBarItem(
                        selected = currentScreen == AppScreen.PATIENTS,
                        onClick = { currentScreen = AppScreen.PATIENTS },
                        label = { Text("Pacientes", fontSize = 11.sp) },
                        icon = { Text("👥", fontSize = 18.sp) },
                        colors = navItemColors()
                    )
                }
            }
        },
        containerColor = DarkBackground
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (currentScreen) {
                AppScreen.HOME -> {
                    MockPlaceholderScreen(
                        title = "Panel Principal MMedic",
                        icon = "🏥",
                        description = "Plataforma clínica multi-tenant de alta precisión. Explora los módulos del sistema.",
                        actionLabel = "Ver Catálogo de Artículos",
                        onActionClick = { currentScreen = AppScreen.ARTICLES }
                    )
                }
                AppScreen.ARTICLES -> {
                    ArticlesScreen(
                        viewModel = articlesViewModel,
                        onNavigateToCreate = { currentScreen = AppScreen.CREATE_ARTICLE }
                    )
                }
                AppScreen.CREATE_ARTICLE -> {
                    ArticleFormScreen(
                        viewModel = articlesViewModel,
                        onBack = { currentScreen = AppScreen.ARTICLES }
                    )
                }
                AppScreen.INVOICES -> {
                    InvoicesScreen(
                        viewModel = invoicesViewModel,
                        onNavigateToCreate = { currentScreen = AppScreen.CREATE_INVOICE }
                    )
                }
                AppScreen.CREATE_INVOICE -> {
                    InvoiceCreateScreen(
                        viewModel = invoicesViewModel,
                        onBack = { currentScreen = AppScreen.INVOICES }
                    )
                }
                AppScreen.ENTITIES -> {
                    EntitiesScreen(
                        viewModel = entitiesViewModel
                    )
                }
                AppScreen.CONTRIBUTORS -> {
                    ContributorsScreen(
                        viewModel = contributorsViewModel
                    )
                }
                AppScreen.CATEGORIES -> {
                    CategoriesScreen(
                        viewModel = categoriesViewModel
                    )
                }
                AppScreen.APPOINTMENTS -> {
                    MockPlaceholderScreen(
                        title = "Gestión de Citas y Agenda",
                        icon = "📅",
                        description = "Módulo de agendamiento y turnos médicos en desarrollo bajo Spec Kit.",
                        actionLabel = "Ir a Artículos",
                        onActionClick = { currentScreen = AppScreen.ARTICLES }
                    )
                }
                AppScreen.PATIENTS -> {
                    CustomersScreen(
                        viewModel = customersViewModel
                    )
                }
                AppScreen.SERVER_STATUS -> {
                    ServerStatusScreen()
                }
            }

            NotificationPushBanner()
        }
    }
}

@Composable
private fun navItemColors(): NavigationBarItemColors {
    return NavigationBarItemDefaults.colors(
        selectedIconColor = DarkPrimary,
        selectedTextColor = DarkPrimary,
        indicatorColor = Color(0x330EA5E9),
        unselectedTextColor = Color(0xFF94A3B8),
        unselectedIconColor = Color(0xFF94A3B8)
    )
}
