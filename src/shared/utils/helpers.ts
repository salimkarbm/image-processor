import { Response } from 'express';
import crypto, { CipherKey } from 'crypto';
import { PaginatedResponse } from '../types/paginate.type';
import { ErrorResponse } from '../types';
import { isAfter, parseISO } from 'date-fns';
import { DateTime } from 'luxon';
import { ENVIRONMENT } from '../../config';
import { Request } from 'express';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommends 12 bytes
const AUTH_TAG_LENGTH = 16;
const KEY_HEX = ENVIRONMENT.OTP.ENCRYPTION_KEY!; // Must be 32 bytes (64 hex chars) for AES-256

// This creates a Uint8Array<ArrayBuffer> which TS accepts
const KEY_BYTES = new Uint8Array(Buffer.from(KEY_HEX, 'hex'));
const KEY = crypto.createSecretKey(KEY_BYTES) as CipherKey;

const ENCRYPTION_KEY = ENVIRONMENT.OTP.ENCRYPTION_KEY
  ? KEY
  : crypto.randomBytes(32);

export const dbTimeStamp = {
  createdAt: 'createdAt',

  updatedAt: 'updatedAt',
};

export const paginate = <T>(
  array: T[],
  page: number,
  limit: number,
): PaginatedResponse<T> => {
  const offset = (page - 1) * limit;
  const paginatedData = array.slice(offset, offset + limit);
  const totalItems = array.length;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const HttpResponse = ({
  response,
  data,
  status = 200,
  message = 'Request successful',
}: {
  status?: number;
  message?: string;
  data?: any;
  response: Response;
}) => {
  return response.status(status).json({ data, message });
};

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const createErrorResponse = (
  code: string,
  message: string,
  details?: any,
): ErrorResponse => ({
  error: {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
  },
});

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    ENCRYPTION_KEY as unknown as Uint8Array,
    iv as unknown as Uint8Array,
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:encrypted
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

export const decrypt = (text: string): string => {
  const [ivHex, authTagHex, encryptedHex] = text.split(':');
  const iv = new Uint8Array(Buffer.from(ivHex, 'hex'));
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY as unknown as Uint8Array,
    iv,
  );
  decipher.setAuthTag(authTag as unknown as Uint8Array);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8'); // throws if tampered
  return decrypted;
};

export function extractPublicId(url: string) {
  const regex = /\/([^/]+)\.[a-z]+$/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
export const getDateAndTime = (minutes = 0) => {
  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() + 1); // Add 1 hour
  currentDate.setMinutes(currentDate.getMinutes() + minutes);
  return currentDate.toISOString();
};
export const getDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalTime = (
  date: Date,
  zone = 'Africa/Lagos',
): string | null => {
  const localTime = DateTime.fromJSDate(date).setZone(zone).toISO();
  return localTime;
};

export const getSwaggerOptions = {
  customCss: `
                .swagger-ui .topbar { display: none }
                .swagger-ui .info { margin: 20px 0 }
                .swagger-ui .scheme-container { margin: 20px 0 }
            `,
  customSiteTitle: 'Image Processor API Documentation',
  swaggerOptions: {
    requestInterceptor: (
      req: Request & { credentials?: string; headers?: Record<string, string> },
    ) => {
      req.credentials = 'include';
      return req;
    },
    responseInterceptor: (
      res: Response & { headers?: Record<string, string> },
    ) => {
      // Capture cookies from responses
      const setCookie = res.headers?.['set-cookie'];
      if (setCookie) {
        console.log('Cookies received:', setCookie);
      }
      return res;
    },
    // persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showCommonExtensions: true,
    withCredentials: true,
  },
};

export const getSecurityHeaders = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, ...args);
    }
  },
};
