import { NextFunction, Request, Response } from 'express';
import SwaggerParser from '@apidevtools/swagger-parser';
import { specConfig } from '../../docs/swagger';

export default async function validateOpenApiSpec(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await SwaggerParser.validate(specConfig);
    next(); // Call next middleware if spec is valid
  } catch (err: any) {
    console.error('❌ OpenAPI validation failed');
    console.error(err.message);
    res.status(500).send('Internal Server Error: OpenAPI validation failed');
  }
}
