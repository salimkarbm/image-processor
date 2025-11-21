import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import xss from 'xss';
import validator from 'validator';

/**
 * Sanitizes a single value based on a set of rules.
 * @param value The string to sanitize.
 * @param rules An optional array of sanitization rule names.
 * @returns The sanitized string.
 */
export const sanitizeInput = (value: string, rules?: string[]): string => {
    let sanitized = value;
    if (!rules || typeof value !== 'string') return sanitized;
    if (rules.includes('trim')) sanitized = sanitized.trim();
    if (rules.includes('escape')) sanitized = validator.escape(sanitized);
    if (rules.includes('xss')) sanitized = xss(sanitized);
    if (rules.includes('toLowerCase')) sanitized = sanitized.toLowerCase();
    return sanitized;
};

/**
 * Validates a request body against a Zod schema and applies sanitization rules.
 * @param schema The Zod schema to validate the request body against.
 * @param sanitizeRules An optional object mapping field names to an array of sanitization rules.
 * @returns An Express middleware function.
 */

export const validateInputWithZod =
    (
        schema: z.ZodObject<any>,
        sanitizeRules?: Record<
            string,
            Array<'trim' | 'escape' | 'xss' | 'toLowerCase'>
        >
    ) =>
    (req: Request, res: Response, next: NextFunction): void => {
        try {
            const parsedData = schema.parse(req.body);

            // Apply sanitization if defined
            if (sanitizeRules) {
                Object.entries(sanitizeRules).forEach(([field, rules]) => {
                    if (parsedData[field]) {
                        parsedData[field] = sanitizeInput(
                            parsedData[field] as string,
                            rules
                        );
                    }
                });
            }

            req.body = parsedData;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.issues.map((issue) => ({
                        path: issue.path.join('.'),
                        message: issue.message
                    }))
                });
                return;
            }
            next(error);
        }
    };
