import { Request, Response, NextFunction } from 'express';
import { auditRepo } from '../repositories';

export function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.path.startsWith('/health')) return next();

  const start = Date.now();

  // Capture response
  const oldJson = res.json;
  let responseBody: any;

  res.json = function (body) {
    responseBody = body;
    return oldJson.call(this, body);
  };

  res.on('finish', async () => {
    // Don't await - don't slow down response
    auditRepo;
    //.create({
    // userId: req.user?.id || 'anonymous',
    // method: req.method,
    //path: req.path,
    // ip: req.ip,
    // userAgent: req.get('user-agent'),
    // statusCode: res.statusCode,
    //requestBody: sanitize(req.body), // remove passwords
    // query: req.query,
    // params: req.params,
    // durationMs: Date.now() - start,
    // responseBody, // careful - can be huge
    // timestamp: new Date(),
    // })
    //.catch(console.error); // log errors but don't crash
  });

  next();
}
