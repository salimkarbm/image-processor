export enum UserRole {
  MASTER_ADMIN = 'master-admin',
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DELETED = 'deleted',
  BANNED = 'banned',
  ARCHIVED = 'archived',
  LOCKED = 'locked',
  UNVERIFIED = 'unverified',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
  ENABLED = 'enabled',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum UserDeviceType {
  IOS = 'ios',
  ANDROID = 'android',
  BROWSER = 'browser',
}

export enum PlatformUser {
  WEB = 'web',
  MOBILE = 'mobile',
}
