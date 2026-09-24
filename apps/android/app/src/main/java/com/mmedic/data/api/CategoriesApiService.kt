package com.mmedic.data.api

import com.mmedic.data.model.*
import retrofit2.http.*

interface CategoriesApiService {

    @GET("api/v1/article-categories")
    suspend fun getCategories(
        @Query("search") search: String? = null
    ): ApiResponse<List<CategoryWithStats>>

    @GET("api/v1/article-categories/{id}")
    suspend fun getCategoryById(@Path("id") id: String): ApiResponse<CategoryWithStats>

    @POST("api/v1/article-categories")
    suspend fun createCategory(@Body dto: CreateCategoryDto): ApiResponse<CategoryWithStats>

    @PUT("api/v1/article-categories/{id}")
    suspend fun updateCategory(
        @Path("id") id: String,
        @Body dto: UpdateCategoryDto
    ): ApiResponse<CategoryWithStats>

    @DELETE("api/v1/article-categories/{id}")
    suspend fun deleteCategory(@Path("id") id: String): ApiResponse<Map<String, Any>>

    @GET("api/v1/article-categories/duplicates")
    suspend fun getDuplicates(): ApiResponse<List<DuplicateCategoryGroup>>

    @POST("api/v1/article-categories/merge")
    suspend fun mergeCategories(@Body dto: MergeCategoriesDto): ApiResponse<CategoryWithStats>
}
