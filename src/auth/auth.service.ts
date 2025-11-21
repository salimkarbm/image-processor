import { NextFunction, Request, Response } from 'express';
import UserRepository from '../repositories/user/user.repository';
import { AppDataSource } from '../database/typeOrm.config';

const userRepo = new UserRepository(AppDataSource.manager);

export default class UserService {
    signUp = async (req: Request, res: Response, next: NextFunction) => {
        const user = await userRepo.findOne({
            where: { email: req.body.email }
        });
        console.log(user);
    };
}
