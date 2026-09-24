/**
 * Contrato de API REST para Gestión de Entidades Colaboradoras
 */

import {
  ApiResponse,
  Entity,
  EntityStatus,
  EntityWithStats,
  CreateEntityDto,
  UpdateEntityDto,
  DuplicateEntityGroup,
  MergeEntitiesDto
} from '@mmedic/types';

export interface EntitiesApiContract {
  /**
   * Obtiene el listado de entidades colaboradoras con contador de artículos
   * GET /api/v1/entities?search=dr&status=ACTIVE
   */
  getEntities(search?: string, status?: EntityStatus): Promise<ApiResponse<EntityWithStats[]>>;

  /**
   * Obtiene el detalle de una entidad por su ID
   * GET /api/v1/entities/:id
   */
  getEntityById(id: string): Promise<ApiResponse<EntityWithStats>>;

  /**
   * Crea una nueva entidad colaboradora
   * POST /api/v1/entities
   */
  createEntity(dto: CreateEntityDto): Promise<ApiResponse<Entity>>;

  /**
   * Actualiza los datos de una entidad existente
   * PUT /api/v1/entities/:id
   */
  updateEntity(id: string, dto: UpdateEntityDto): Promise<ApiResponse<Entity>>;

  /**
   * Elimina una entidad (sólo si articlesCount === 0)
   * DELETE /api/v1/entities/:id
   */
  deleteEntity(id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>>;

  /**
   * Analiza y detecta grupos de entidades candidatas a duplicadas
   * GET /api/v1/entities/duplicates
   */
  getDuplicateCandidates(): Promise<ApiResponse<DuplicateEntityGroup[]>>;

  /**
   * Fusiona la entidad secundaria dentro de la entidad principal
   * POST /api/v1/entities/merge
   */
  mergeEntities(dto: MergeEntitiesDto): Promise<ApiResponse<EntityWithStats>>;
}
