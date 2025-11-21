export interface IUser {
    id?: string;
    email: string;
    username: string;
    password: string;
    // role: UserRole;
    // status: UserStatus;
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
