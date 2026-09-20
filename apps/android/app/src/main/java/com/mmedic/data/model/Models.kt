package com.mmedic.data.model

data class HealthResponse(
    val status: String,
    val service: String,
    val version: String,
    val uptime: Long,
    val database: String,
    val timestamp: String
)

data class Patient(
    val id: String,
    val dni: String,
    val firstName: String,
    val lastName: String,
    val phone: String?,
    val email: String?,
    val bloodType: String?
)

data class Appointment(
    val id: String,
    val dateTime: String,
    val status: String,
    val reason: String,
    val notes: String?,
    val patient: Patient?
)
