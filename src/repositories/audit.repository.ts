import BaseRepository from '../libs/base.repository';
import { EntityManager } from 'typeorm';
import { AuditLog } from '../audit/entities/audit.entity';
import { AppDataSource } from '../config/typeorm.config';

export class AuditRepository extends BaseRepository<AuditLog> {
  constructor(entityManager: EntityManager) {
    super(entityManager.getRepository(AuditLog));
  }
}

export const auditRepo = new AuditRepository(AppDataSource.manager);
