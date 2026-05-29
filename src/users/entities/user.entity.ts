import {
  Entity,
  Column,
  BeforeInsert,
  BeforeUpdate,
  DeleteDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import BaseEntity from '../../repositories/base.entity';
import {
  Gender,
  PlatformUser,
  UserDeviceType,
  UserRole,
  UserStatus,
} from '../../shared/enums/index';
import {
  LoginAttempt,
  UserSession,
  LoginHistoryEntry,
} from '../../shared/types/users/user.type';

@Entity({ name: 'users', schema: 'public' })
export default class User extends BaseEntity {
  @Column({
    unique: true,
    nullable: false,
    comment: 'User email address',
  })
  email!: string;

  @Column({
    nullable: false,
    comment: 'User password',
  })
  password!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({
    nullable: true,
  })
  otherName!: string;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.OTHER,
  })
  gender!: Gender;

  @Column({
    nullable: true,
  })
  dateOfBirth!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt?: Date | null;

  @Column({ nullable: true })
  suspensionReason!: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  loginAttempts?: LoginAttempt;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status!: UserStatus;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  termsVersion!: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  termsAcceptedAt!: Date | null;

  @Column({ nullable: true })
  termsAcceptedIp!: string;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  // @Column({ default: false })
  // isVerified!: boolean;

  // @Column({ default: false })
  // isBlocked!: boolean;

  // @Column({
  //   type: 'timestamp',
  //   nullable: true,
  // })
  // failedLogin!: Date;

  // @Column({
  //   type: 'jsonb',
  //   nullable: true,
  // })
  // otpAttempts?: LoginAttempt;

  // @Column({
  //   type: 'jsonb',
  //   nullable: true,
  // })
  // resetAttempts?: LoginAttempt;

  // @Column({
  //   type: 'jsonb',
  //   nullable: true,
  // })
  // activeSessions?: UserSession[];

  // @Column({
  //   type: 'jsonb',
  //   default: [],
  // })
  // loginHistory!: LoginHistoryEntry[];

  // @Column({ default: 0 })
  // totalActiveDays!: number;

  // @Column({
  //   type: 'jsonb',
  //   nullable: true,
  // })
  // activityMilestones?: {
  //   thirtyDays?: Date;
  //   hundredDays?: Date;
  //   oneYear?: Date;
  //   twoYears?: Date;
  // };

  // @Column('jsonb', { default: [] })
  // securityAuditLog!: {
  //   action: string;
  //   timestamp: Date;
  //   ipAddress?: string;
  //   userAgent?: string;
  //   userEmailSnapshot: string;
  //   userRoleSnapshot: string;
  //   metadata?: Record<string, any>;
  // }[];

  // @Column('jsonb', { default: [] })
  // refreshTokens!: {
  //   token: string;
  //   expiresAt: Date;
  //   deviceInfo: string;
  //   createdAt: Date;
  // }[];

  // @Column({
  //   type: 'varchar',
  //   nullable: true,
  // })
  // platform!: PlatformUser | null;

  // @Column({
  //   type: 'varchar',
  //   nullable: true,
  // })
  // deviceType!: UserDeviceType | null;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      // bcrypt hashes begin with $2a/$2b/$2y
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(password, this.password);
    return isMatch;
  }
}
