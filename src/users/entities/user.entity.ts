import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  UpdateDateColumn,
  CreateDateColumn,
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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column( {
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

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status!: UserStatus;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  emailVerificationExpires?: Date;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ default: false })
  isOtpVerified!: boolean;

  @Column({ nullable: true })
  otpToken!: string;

  @Column({ nullable: true })
  otpExpires!: Date;

  @Column({ nullable: true })
  resetToken?: string;

  @Column({ nullable: true })
  resetTokenExpires?: Date;

  @Column({ nullable: true })
  suspensionReason!: string;

  // @Column({ default: false })
  // isApproved!: boolean;

  // @Column({ default: false })
  // isVerified!: boolean;

  // @Column({
  //   type: 'jsonb',
  //   nullable: true,
  // })
  // loginAttempts?: LoginAttempt;

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

  // @Column({ nullable: true })
  // lastLoginAt!: Date;

  // @Column({
  //   type: 'timestamp',
  //   nullable: true,
  // })
  // lastLogin!: Date;

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
  //   nullable: false,
  //   comment: 'User active status',
  //   default: false,
  // })
  // isActive!: boolean;

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

  @Column({
    type: 'varchar',
    nullable: true,
  })
  platform!: PlatformUser | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  deviceType!: UserDeviceType | null;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

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
