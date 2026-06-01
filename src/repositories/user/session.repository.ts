import { EntityManager } from 'typeorm';
import BaseRepository from '../../libs/base.repository';
import { AppDataSource } from '../../config/typeorm.config';
import Session from '../../users/entities/session.entity';

export class SessionRepository extends BaseRepository<Session> {
  constructor(entityManager: EntityManager) {
    super(entityManager.getRepository(Session));
  }
}

const sessionRepo = new SessionRepository(AppDataSource.manager);
export default sessionRepo;
