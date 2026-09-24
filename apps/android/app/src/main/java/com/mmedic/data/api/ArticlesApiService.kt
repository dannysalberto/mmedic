package com.mmedic.data.api

import com.mmedic.data.model.*
import retrofit2.http.*

interface ArticlesApiService {

    @GET("api/v1/articles")
    suspend fun getArticles(
        @Query("search") search: String? = null,
        @Query("categoryId") categoryId: String? = null
    ): ApiResponse<List<Article>>

    @GET("api/v1/articles/{id}")
    suspend fun getArticleById(@Path("id") id: String): ApiResponse<Article>

    @POST("api/v1/articles")
    suspend fun createArticle(@Body dto: CreateArticleDto): ApiResponse<Article>

    @PUT("api/v1/articles/{id}")
    suspend fun updateArticle(
        @Path("id") id: String,
        @Body dto: CreateArticleDto
    ): ApiResponse<Article>

    @GET("api/v1/article-categories")
    suspend fun getCategories(): ApiResponse<List<ArticleCategory>>

    @POST("api/v1/article-categories")
    suspend fun createCategory(@Body dto: CreateCategoryDto): ApiResponse<ArticleCategory>

    @GET("api/v1/entities")
    suspend fun getEntities(@Query("search") search: String? = null): ApiResponse<List<Entity>>

    @GET("api/v1/entities/by-code/{code}")
    suspend fun getEntityByCode(@Path("code") code: String): ApiResponse<Entity>

    @POST("api/v1/entities")
    suspend fun createEntity(@Body dto: CreateEntityDto): ApiResponse<Entity>
}
