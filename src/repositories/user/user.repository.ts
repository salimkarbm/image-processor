import { EntityManager } from 'typeorm';
import User from '../../users/entities/user.entity';
import BaseRepository from '../../libs/base/base.repository';

export default class UserRepository extends BaseRepository<User> {
  constructor(entityManager: EntityManager) {
    super(entityManager.getRepository(User));
  }
}
