package com.mmedic.data.model

data class ApiResponse<T>(
    val success: Boolean,
    val data: T,
    val message: String? = null,
    val timestamp: String? = null
)

data class ArticleCategory(
    val id: String,
    val name: String,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class CreateCategoryDto(
    val name: String
)

data class UpdateCategoryDto(
    val name: String? = null
)

data class CategoryWithStats(
    val id: String,
    val name: String,
    val articlesCount: Int = 0,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class DuplicateCategoryGroup(
    val normalizedName: String,
    val categories: List<CategoryWithStats>,
    val matchScore: Int = 95
)

data class MergeCategoriesDto(
    val primaryCategoryId: String,
    val secondaryCategoryId: String
)

data class Entity(
    val id: String,
    val code: String,
    val name: String,
    val status: String = "ACTIVE",
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class CreateEntityDto(
    val code: String,
    val name: String,
    val status: String = "ACTIVE"
)

data class UpdateEntityDto(
    val code: String? = null,
    val name: String? = null,
    val status: String? = null
)

data class EntityWithStats(
    val id: String,
    val code: String,
    val name: String,
    val status: String = "ACTIVE",
    val articlesCount: Int = 0,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class DuplicateEntityGroup(
    val normalizedName: String,
    val entities: List<EntityWithStats>,
    val matchScore: Int = 95
)

data class MergeEntitiesDto(
    val primaryEntityId: String,
    val secondaryEntityId: String
)


data class ArticleParticipant(
    val id: String? = null,
    val articleId: String? = null,
    val entityId: String,
    val percentage: Double,
    val entity: Entity? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class ArticleParticipantItemDto(
    val entityId: String,
    val percentage: Double
)

data class Article(
    val id: String,
    val code: String,
    val name: String,
    val categoryId: String,
    val category: ArticleCategory? = null,
    val price1: Double,
    val price2: Double? = null,
    val price3: Double? = null,
    val price4: Double? = null,
    val isActive: Boolean = true,
    val appliesVat: Boolean = false,
    val participants: List<ArticleParticipant>? = null,
    val participantsCount: Int? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class CreateArticleDto(
    val code: String,
    val name: String,
    val categoryId: String,
    val price1: Double,
    val price2: Double? = null,
    val price3: Double? = null,
    val price4: Double? = null,
    val appliesVat: Boolean = false,
    val participants: List<ArticleParticipantItemDto>? = null
)

data class ParticipantItemState(
    val entityId: String,
    val code: String,
    val name: String,
    val status: String = "ACTIVE",
    val percentage: Double
)
