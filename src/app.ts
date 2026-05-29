import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
// import swaggerOptions from './swagger-jsdoc';
import AppError from './shared/utils/errors/appError';
import { errorHandler } from './middlewares/errors/errorMiddleware';
import router from './routes/v1';
import { AppDataSource } from './config/typeorm.config';
import { ENVIRONMENT } from './config';
import { specConfig } from './docs/v1/swagger';
import validateOpenApiSpec from './middlewares/doc/openapi.validation.middleware';
import redisService from './shared/services/Redis/queue-redis.service';
import { getSecurityHeaders, getSwaggerOptions } from './shared/utils';

dotenv.config();

// Initialize express
const app: Application = express();

async function bootstrap() {
  // const specs: swaggerJsdoc.Options = swaggerOptions; // Swagger options from swagger-jsdoc
  const specs: swaggerJsdoc.Options = specConfig;

  // Security middleware
  app.use(helmet(getSecurityHeaders));

  let ALLOW_ORIGINS: string[] = [];

  if (ENVIRONMENT.APP.env === 'development') {
    ALLOW_ORIGINS = [
      ...ALLOW_ORIGINS,
      'http://localhost:8000',
      'http://localhost:3001',
    ];
  }
  ALLOW_ORIGINS = [...ALLOW_ORIGINS];

  const corsOptions: cors.CorsOptions = {
    origin(origin, callback) {
      if (!origin || ALLOW_ORIGINS.includes(origin))
        return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  };
  app.use(cors(corsOptions));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error: 'Too many requests from this IP',
      retryAfter: '15 minutes',
    },
  });

  app.use('/api/', limiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
    }),
  );
  app.use(cookieParser());
  app.use(compression());

  // Enforce HTTPS in production
  const enforceHTTPS = (req: Request, res: Response, next: NextFunction) => {
    if (
      ENVIRONMENT.APP.env === 'production' &&
      req.header('x-forwarded-proto') !== 'https'
    ) {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  };
  app.use(enforceHTTPS);

  // OpenAPI validation middleware
  app.use(validateOpenApiSpec);

  // Swagger UI setup
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, getSwaggerOptions),
  );

  const PORT = ENVIRONMENT.APP.port || 3000;

  // Define index route
  app.get('/', async (req: Request, res: Response) => {
    res.contentType('json');
    res.json({
      status: 'ok',
      message: 'Welcome',
    });
  });

  // Routes
  app.use('/api/v1', router);

  // Errors
  app.all('*', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`can't find ${req.originalUrl} on server!`, 404));
  });
  app.use(errorHandler);

  await redisService.connect();
  // Listen for server
  AppDataSource.initialize()
    .then(async () => {
      app.listen(PORT, () => {
        console.log(
          `
          🚀 Database connected successfully
          🚀 API Server running on port ${PORT}
          📚 API Documentation available at: http://localhost:${PORT}/api-docs
          `,
        );
      });
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err);
      process.exit(1);
    });
}

bootstrap().catch((err) => {
  console.error('?❌ Startup failed', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await AppDataSource.destroy();
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  await AppDataSource.destroy();
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
export default app;
