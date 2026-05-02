import { NextFunction, Request, Response } from 'express';
import { HttpResponse } from '../../../shared/utils';
import UserService from '../../../auth/auth.service';
import { STATUS_CODE, SUCCESS_MESSAGE } from '../../../shared/constants';

const userService = new UserService();
export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await userService.signUp(req);
    return HttpResponse({
      response: res,
      data,
      status: STATUS_CODE.CREATED,
      message: SUCCESS_MESSAGE.CREATED('User'),
    });
  } catch (err) {
    return next(err);
  }
};

export const login = async (req: Request, res: Response) => {
  res.contentType('json');
  res.json({
    status: 'ok',
    message: 'API is healthy, service is up and running',
    timestamp: new Date().toISOString(),
    service: 'Image Processor API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
};
