import { NextFunction, Request, Response } from 'express';

// Add middleware to detect client type
export const detectClientType = (
  req: Request & { isMobile?: boolean },
  res: Response,
  next: NextFunction,
) => {
  const userAgent = req.headers['user-agent'] || '';
  const clientType = req.headers['x-client-type'] as string; // Mobile apps send this

  if (
    clientType === 'mobile' ||
    /mobile|android|iphone|ipad|react native/i.test(userAgent)
  ) {
    req.isMobile = true;
  } else {
    req.isMobile = false;
  }
  next();
};
