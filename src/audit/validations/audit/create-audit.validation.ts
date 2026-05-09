import { z } from 'zod';
import { AuditAction, AuditModule } from '../../../shared/enums';

export const auditSchema = z.object({
  userId: z.string(),

  action: z.enum(Object.values(AuditAction)),

  module: z.enum(Object.values(AuditModule)),

  details: z.object().optional(),

  ipAddress: z.string().optional(),

  userAgent: z.string().optional(),
});
