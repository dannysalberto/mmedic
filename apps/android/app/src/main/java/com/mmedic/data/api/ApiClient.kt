package com.mmedic.data.api

import com.mmedic.data.model.Appointment
import com.mmedic.data.model.HealthResponse
import com.mmedic.data.model.Patient
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

data class LoginDto(val username: String, val password: String)
data class LoginResponse(val accessToken: String)

interface ApiService {
    @GET("api/v1/health")
    suspend fun checkHealth(): HealthResponse

    @POST("api/v1/auth/login")
    suspend fun login(@Body dto: LoginDto): LoginResponse

    @GET("api/v1/patients")
    suspend fun getPatients(@Query("search") search: String? = null): List<Patient>

    @GET("api/v1/patients/{id}")
    suspend fun getPatientById(@Path("id") id: String): Patient

    @GET("api/v1/appointments")
    suspend fun getAppointments(@Query("status") status: String? = null): List<Appointment>
}

object ApiClient {
    // 10.0.2.2 es la IP del host accesible desde el emulador de Android
    var baseUrl: String = "http://10.0.2.2:3000/"
    var authToken: String? = null

    private val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val builder = original.newBuilder()
        authToken?.let { token ->
            builder.header("Authorization", "Bearer $token")
        }
        chain.proceed(builder.build())
    }

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(logging)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private fun getRetrofit(): Retrofit {
        val formattedUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        return Retrofit.Builder()
            .baseUrl(formattedUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    fun create(): ApiService {
        return getRetrofit().create(ApiService::class.java)
    }

    fun createArticlesApi(): ArticlesApiService {
        return getRetrofit().create(ArticlesApiService::class.java)
    }

    fun createEntitiesApi(): EntitiesApiService {
        return getRetrofit().create(EntitiesApiService::class.java)
    }

    fun createCategoriesApi(): CategoriesApiService {
        return getRetrofit().create(CategoriesApiService::class.java)
    }

    fun createCustomersApi(): CustomersApiService {
        return getRetrofit().create(CustomersApiService::class.java)
    }

    fun createInvoicesApi(): InvoicesApiService {
        return getRetrofit().create(InvoicesApiService::class.java)
    }

    fun createContributorsApi(): ContributorsApiService {
        return getRetrofit().create(ContributorsApiService::class.java)
    }
}


