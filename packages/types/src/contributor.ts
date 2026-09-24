import { Entity } from './index';

export type ContributorStatus = 'ACTIVE' | 'INACTIVE';

export interface Contributor {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  status: ContributorStatus;
  entityId?: string | null;
  entity?: Entity | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContributorDto {
  code: string;
  name: string;
  status?: ContributorStatus;
  entityId?: string | null;
}

export interface UpdateContributorDto {
  code?: string;
  name?: string;
  status?: ContributorStatus;
  entityId?: string | null;
}

export interface ContributorWithStats extends Contributor {
  articlesCount: number;
}

export interface DuplicateContributorGroup {
  normalizedName: string;
  contributors: ContributorWithStats[];
  matchScore: number;
}

export interface MergeContributorsDto {
  primaryContributorId: string;
  secondaryContributorId: string;
}

export interface ContributorFilterQuery {
  search?: string;
  status?: ContributorStatus | 'ALL';
  page?: number;
  limit?: number;
}
