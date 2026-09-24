package com.mmedic.data.api

import com.mmedic.data.model.*
import retrofit2.http.*

interface EntitiesApiService {

    @GET("api/v1/entities")
    suspend fun getEntities(
        @Query("search") search: String? = null,
        @Query("status") status: String? = null
    ): ApiResponse<List<EntityWithStats>>

    @GET("api/v1/entities/{id}")
    suspend fun getEntityById(@Path("id") id: String): ApiResponse<EntityWithStats>

    @POST("api/v1/entities")
    suspend fun createEntity(@Body dto: CreateEntityDto): ApiResponse<EntityWithStats>

    @PUT("api/v1/entities/{id}")
    suspend fun updateEntity(
        @Path("id") id: String,
        @Body dto: UpdateEntityDto
    ): ApiResponse<EntityWithStats>

    @DELETE("api/v1/entities/{id}")
    suspend fun deleteEntity(@Path("id") id: String): ApiResponse<Map<String, Any>>

    @GET("api/v1/entities/duplicates")
    suspend fun getDuplicates(): ApiResponse<List<DuplicateEntityGroup>>

    @POST("api/v1/entities/merge")
    suspend fun mergeEntities(@Body dto: MergeEntitiesDto): ApiResponse<EntityWithStats>
}
