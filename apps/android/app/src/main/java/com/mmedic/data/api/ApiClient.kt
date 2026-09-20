package com.mmedic.data.api

import com.mmedic.data.model.Appointment
import com.mmedic.data.model.HealthResponse
import com.mmedic.data.model.Patient
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

interface ApiService {
    @GET("api/v1/health")
    suspend fun checkHealth(): HealthResponse

    @GET("api/v1/patients")
    suspend fun getPatients(@Query("search") search: String? = null): List<Patient>

    @GET("api/v1/patients/{id}")
    suspend fun getPatientById(@Path("id") id: String): Patient

    @GET("api/v1/appointments")
    suspend fun getAppointments(@Query("status") status: String? = null): List<Appointment>
}

object ApiClient {
    // 10.0.2.2 es la IP del host accesible desde el emulador de Android
    // Para dispositivo físico por WiFi, cambiar a la IP de la máquina (ej: 192.168.1.50:3000)
    var baseUrl: String = "http://10.0.2.2:3000/"

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(logging)
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    fun create(): ApiService {
        val formattedUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        return Retrofit.Builder()
            .baseUrl(formattedUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
