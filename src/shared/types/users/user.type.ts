import { UserRole, UserStatus } from '../../enums/index';

export interface LoginAttempt {
  count: number;
  lastAttempt: Date;
}

export interface UserSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  expiresAt: Date;
}

export interface LoginHistoryEntry {
  date: Date;
  ipAddress: string;
  userAgent: string;
}

export interface IUser {
  id?: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  isOtpVerified: boolean;
  isApproved: boolean;
  loginHistory: {
    date: Date;
    ipAddress: string;
    userAgent: string;
  }[];
  securityAuditLog: {
    action: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }[];
  refreshTokens: {
    token: string;
    expiresAt: Date;
    deviceInfo: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role?: 'user' | 'admin' | 'moderator';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'user' | 'admin' | 'moderator';
}
