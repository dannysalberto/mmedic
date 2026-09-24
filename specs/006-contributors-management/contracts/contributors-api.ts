/**
 * Contrato de API REST para Gestión de Personal y Colaboradores Técnicos/Profesionales
 */

import {
  ApiResponse,
  Contributor,
  ContributorStatus,
  ContributorWithStats,
  CreateContributorDto,
  UpdateContributorDto,
  DuplicateContributorGroup,
  MergeContributorsDto,
  ContributorFilterQuery
} from '@mmedic/types';

export interface ContributorsApiContract {
  /**
   * Obtiene el listado de colaboradores con filtros y estadísticas de asociaciones
   * GET /api/v1/contributors?search=dr&status=ACTIVE&page=1&limit=20
   */
  getContributors(query?: ContributorFilterQuery): Promise<ApiResponse<ContributorWithStats[]>>;

  /**
   * Obtiene el detalle de un colaborador por su ID
   * GET /api/v1/contributors/:id
   */
  getContributorById(id: string): Promise<ApiResponse<ContributorWithStats>>;

  /**
   * Registra un nuevo colaborador técnico o profesional
   * POST /api/v1/contributors
   */
  createContributor(dto: CreateContributorDto): Promise<ApiResponse<Contributor>>;

  /**
   * Actualiza los datos de un colaborador existente
   * PUT /api/v1/contributors/:id
   */
  updateContributor(id: string, dto: UpdateContributorDto): Promise<ApiResponse<Contributor>>;

  /**
   * Elimina un colaborador de forma segura (sólo si no posee asociaciones)
   * DELETE /api/v1/contributors/:id
   */
  deleteContributor(id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>>;

  /**
   * Detecta y devuelve grupos de colaboradores potencialmente duplicados
   * GET /api/v1/contributors/duplicates
   */
  getDuplicateCandidates(): Promise<ApiResponse<DuplicateContributorGroup[]>>;

  /**
   * Fusiona atómicamente un colaborador secundario dentro del principal
   * POST /api/v1/contributors/merge
   */
  mergeContributors(dto: MergeContributorsDto): Promise<ApiResponse<ContributorWithStats>>;
}
