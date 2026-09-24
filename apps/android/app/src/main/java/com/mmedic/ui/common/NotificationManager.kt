package com.mmedic.ui.common

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class NotificationType {
    SUCCESS,
    ERROR,
    WARNING,
    INFO
}

data class PushNotification(
    val id: String = java.util.UUID.randomUUID().toString(),
    val type: NotificationType,
    val title: String,
    val message: String,
    val durationMs: Long = 3500L
)

object NotificationManager {
    private val _currentNotification = MutableStateFlow<PushNotification?>(null)
    val currentNotification: StateFlow<PushNotification?> = _currentNotification.asStateFlow()

    private var dismissJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    fun show(
        type: NotificationType,
        title: String,
        message: String,
        durationMs: Long = if (type == NotificationType.ERROR) 5000L else 3500L
    ) {
        dismissJob?.cancel()
        val notif = PushNotification(
            type = type,
            title = title,
            message = message,
            durationMs = durationMs
        )
        _currentNotification.value = notif

        dismissJob = scope.launch {
            delay(durationMs)
            if (_currentNotification.value?.id == notif.id) {
                _currentNotification.value = null
            }
        }
    }

    fun showSuccess(title: String, message: String, durationMs: Long = 3500L) {
        show(NotificationType.SUCCESS, title, message, durationMs)
    }

    fun showError(title: String, message: String, durationMs: Long = 5000L) {
        show(NotificationType.ERROR, title, message, durationMs)
    }

    fun showWarning(title: String, message: String, durationMs: Long = 4000L) {
        show(NotificationType.WARNING, title, message, durationMs)
    }

    fun showInfo(title: String, message: String, durationMs: Long = 3500L) {
        show(NotificationType.INFO, title, message, durationMs)
    }

    fun dismiss() {
        dismissJob?.cancel()
        _currentNotification.value = null
    }
}
