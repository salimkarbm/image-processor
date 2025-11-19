import { Request, Response } from 'express';

export const securityRecommendations = async (req: Request, res: Response) => {
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
};

export const securityHeader = async (req: Request, res: Response) => {
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
};
