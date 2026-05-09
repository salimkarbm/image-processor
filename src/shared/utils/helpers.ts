import { Response } from 'express';
import crypto, { CipherKey } from 'crypto';
import { PaginatedResponse } from '../types/paginate.type';
import { ErrorResponse } from '../types';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommends 12 bytes
const AUTH_TAG_LENGTH = 16;
const KEY_HEX = process.env.ENCRYPTION_KEY!; // Must be 32 bytes (64 hex chars) for AES-256

// This creates a Uint8Array<ArrayBuffer> which TS accepts
const KEY_BYTES = new Uint8Array(Buffer.from(KEY_HEX, 'hex'));
const KEY = crypto.createSecretKey(KEY_BYTES) as CipherKey;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
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
  data: any;
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
