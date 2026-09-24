package com.mmedic.data.api

import com.mmedic.data.model.*
import retrofit2.http.*

interface ContributorsApiService {

    @GET("api/v1/contributors")
    suspend fun getContributors(
        @Query("search") search: String? = null,
        @Query("status") status: String? = null
    ): ApiResponse<List<ContributorWithStats>>

    @GET("api/v1/contributors/{id}")
    suspend fun getContributorById(@Path("id") id: String): ApiResponse<ContributorWithStats>

    @POST("api/v1/contributors")
    suspend fun createContributor(@Body dto: CreateContributorDto): ApiResponse<ContributorWithStats>

    @PUT("api/v1/contributors/{id}")
    suspend fun updateContributor(
        @Path("id") id: String,
        @Body dto: UpdateContributorDto
    ): ApiResponse<ContributorWithStats>

    @DELETE("api/v1/contributors/{id}")
    suspend fun deleteContributor(@Path("id") id: String): ApiResponse<Map<String, Any>>

    @GET("api/v1/contributors/duplicates")
    suspend fun getDuplicates(): ApiResponse<List<DuplicateContributorGroup>>

    @POST("api/v1/contributors/merge")
    suspend fun mergeContributors(@Body dto: MergeContributorsDto): ApiResponse<ContributorWithStats>
}
