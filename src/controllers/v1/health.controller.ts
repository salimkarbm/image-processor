import { Request, Response } from 'express';

const health = async (req: Request, res: Response) => {
    res.contentType('json');
    res.json({
        status: 'ok',
        message: 'API is healthy, service is up and running',
        timestamp: new Date().toISOString(),
        service: 'Image Processor API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
};

export default health;
