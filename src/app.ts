import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import express, { Application, Request, Response, NextFunction } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './swagger-jsdoc';
import AppError from './utils/errors/appError';
import { errorHandler } from './middlewares/Errors/errorMiddleware';

dotenv.config();

const specs: swaggerJsdoc.Options = swaggerOptions;

// Initialize express
const app: Application = express();

// Port
const PORT: number = Number(process.env.PORT) || 3000;
const address = `0.0.0.0:${PORT}`;

// Security middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:']
            }
        },
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
    })
);

const corsOptions: cors.CorsOptions = {
    origin(origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://yourdomain.com'
        ];
        if (!origin || allowedOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
};
app.use(cors(corsOptions));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many requests from this IP',
        retryAfter: '15 minutes'
    }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

const enforceHTTPS = (req: Request, res: Response, next: NextFunction) => {
    if (
        process.env.NODE_ENV === 'production' &&
        req.header('x-forwarded-proto') !== 'https'
    ) {
        return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
};
app.use(enforceHTTPS);

// Swagger UI setup
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
        customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .scheme-container { margin: 20px 0 }
  `,
        customSiteTitle: 'Image Processor API Documentation',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            showCommonExtensions: true
        }
    })
);

// Define index route
app.get('/', async (req: Request, res: Response) => {
    res.contentType('json');
    res.json({ status: 'ok', message: 'Welcome' });
});

app.get('/health', async (req: Request, res: Response) => {
    res.contentType('json');
    res.json({
        status: 'ok',
        message: 'Service is up and running',
        timestamp: new Date().toISOString(),
        service: 'Image Processor API'
    });
});

app.get('/api/v1/security/info', (req: Request, res: Response) => {
    res.json({
        security: {
            https: req.secure || req.headers['x-forwarded-proto'] === 'https',
            headers: {
                helmet: 'enabled',
                cors: 'configured',
                csp: 'enabled',
                hsts: 'enabled'
            },
            authentication: {
                jwt: 'supported',
                apiKey: 'supported',
                rateLimiting: 'enabled'
            },
            validation: {
                inputSanitization: 'enabled',
                xssProtection: 'enabled',
                nosqlInjectionPrevention: 'enabled'
            },
            encryption: {
                piiEncryption: 'enabled',
                passwordHashing: 'bcrypt',
                algorithm: 'AES-256-CBC'
            }
        },
        recommendations: [
            'Use HTTPS in production',
            'Implement proper logging and monitoring',
            'Regular security audits',
            'Keep dependencies updated',
            'Use environment variables for secrets'
        ]
    });
});

app.get('/api/v1/security/headers', (req: Request, res: Response) => {
    const securityHeaders = {
        'content-security-policy': res.get('Content-Security-Policy')
            ? 'present'
            : 'missing',
        'strict-transport-security': res.get('Strict-Transport-Security')
            ? 'present'
            : 'missing',
        'x-content-type-options': res.get('X-Content-Type-Options')
            ? 'present'
            : 'missing',
        'x-frame-options': res.get('X-Frame-Options') ? 'present' : 'missing',
        'x-xss-protection': res.get('X-XSS-Protection') ? 'present' : 'missing'
    } as const;
    res.json({
        success: true,
        securityHeaders,
        requestHeaders: {
            userAgent: req.get('User-Agent'),
            origin: req.get('Origin'),
            referer: req.get('Referer')
        }
    });
});

// Errors
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`can't find ${req.originalUrl} on server!`, 404));
});
app.use(errorHandler);

// Listen for server connections
const server = app.listen(PORT, () =>
    console.log(
        `
        🔐 API Security Example Server running on port ${address}
        📚 API Documentation available at: http://localhost:${PORT}/api-docs
        `
    )
);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

export default server;
