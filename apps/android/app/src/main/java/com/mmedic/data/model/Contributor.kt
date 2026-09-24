package com.mmedic.data.model

data class Contributor(
    val id: String,
    val code: String,
    val name: String,
    val status: String = "ACTIVE",
    val entityId: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class CreateContributorDto(
    val code: String,
    val name: String,
    val status: String = "ACTIVE",
    val entityId: String? = null
)

data class UpdateContributorDto(
    val code: String? = null,
    val name: String? = null,
    val status: String? = null,
    val entityId: String? = null
)

data class ContributorWithStats(
    val id: String,
    val code: String,
    val name: String,
    val status: String = "ACTIVE",
    val entityId: String? = null,
    val articlesCount: Int = 0,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class DuplicateContributorGroup(
    val normalizedName: String,
    val contributors: List<ContributorWithStats>,
    val matchScore: Int = 95
)

data class MergeContributorsDto(
    val primaryContributorId: String,
    val secondaryContributorId: String
)
