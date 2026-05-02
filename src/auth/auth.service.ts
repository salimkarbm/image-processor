import { Request } from 'express';
import UserRepository from '../repositories/user/user.repository';
import { AppDataSource } from '../config/db.config';
import AppError from '../shared/utils/errors/appError';
import { ERROR_MESSAGE, STATUS_CODE } from '../shared/constants';

const userRepo = new UserRepository(AppDataSource.manager);

export default class UserService {
  signUp = async (req: Request) => {
    const existingUser = await userRepo.findOne({
      where: { email: req.body.email },
    });
    if (existingUser) {
      throw new AppError(
        ERROR_MESSAGE.ALREADY_EXISTS('User'),
        STATUS_CODE.NOT_FOUND,
      );
    }
    const user = userRepo.create({ ...req.body });
    await userRepo.save(user);
    return user;
  };
}
