import { CookieOptions, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import userRepo from '../repositories/user/user.repository';
import AppError from '../shared/utils/errors/appError';
import {
  AuditAction,
  AuditModule,
  ERROR_MESSAGE,
  STATUS_CODE,
} from '../shared/constants';
import emailService from '../shared/services/email.service';
import otpService from '../shared/services/otp.service';
import { ENVIRONMENT } from '../config';
import User from '../users/entities/user.entity';
import otpRepo from '../repositories/user/otp.repository';
import { OTP_TYPE } from '../shared/enums/otp.enum';
import jwtService from '../shared/services/jwt.service';
import Session from '../users/entities/session.entity';
import sessionRepo from '../repositories/user/session.repository';
import { addMinutes, addSeconds, differenceInMinutes } from 'date-fns';
import { CreateSession } from '../shared/types/users/session.type';
import { IsNull } from 'typeorm';
import { JOB_TYPES, queueService } from '../shared/services/queue.service';
import { auditEvents } from '../audit/audit.service';

export class AuthService {
  private readonly RESET_TOKEN_VALIDITY_MINUTES = 60;
  private readonly RESET_COOL_DOWN_MINUTES = 15;
  private readonly SESSION_EXPIRY_DAYS = 7;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;
  private readonly MAX_CONCURRENT_SESSIONS = 3;
  private readonly UNVERIFIED_USER_EXPIRY_HOURS = 24;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_COOL_DOWN_MINUTES = 15;
  private readonly OTP_COOL_DOWN_MINUTES = 5;
  private readonly MAX_OTP_ATTEMPTS = 3;
  private readonly SALT_ROUND = 12;

  constructor() {}

  private createOtp = async (
    identifier: string,
    type: OTP_TYPE,
  ): Promise<string> => {
    const otpExist = otpRepo.findOne({
      where: {
        identifier,
        type,
        isUsed: false,
      },
    });
    const otpCode = otpService.generate();
    const hashedOtp = otpService.strongHash(otpCode);
    const otp = otpRepo.create({
      identifier,
      type,
      code: hashedOtp,
      expiredAt: otpService.calculateExpiration(
        ENVIRONMENT.OTP.EXPIRY_TIME_IN_MINUTES,
      ),
      nextResendAt: otpService.nextResendTime(1), // set next resend time to 1 minute later to prevent spamming
    });
    await otpRepo.save(otp);
    return otpCode;
  };

  // private sendVerificationEmail = async (
  //   user: User,
  //   otp: string,
  //   message: any,
  // ) => {
  //   try {
  //     const sendEmail = await emailService.signupOtpEmail(
  //       message,
  //       otp,
  //       user.firstName,
  //     );
  //     // retry ONLY if sending failed
  //     if (sendEmail.rejected.length > 0) {
  //       await emailService.retryEmail(
  //         message,
  //         emailService.signupOtpEmail.bind(emailService),
  //       );
  //     }
  //     return sendEmail;
  //   } catch (error) {
  //     // retry ONLY when email sending throws error
  //     // await emailService.retryEmail(message, sendEmail);

  //     // optional: remove user if email completely fails
  //     await userRepo.delete({
  //       id: user.id,
  //     });

  //     await otpRepo.delete({
  //       identifier: user.email,
  //     });

  //     throw new AppError(
  //       'Failed to send verification email',
  //       STATUS_CODE.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // };
  private sendAuthCookie = (res: Response, token: string): void => {
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      maxAge: ENVIRONMENT.JWT.accessTokenExpiryInSeconds,
      sameSite: 'lax', // CSRF protection
    };

    if (ENVIRONMENT.APP.env === 'production') {
      cookieOptions.secure = true; // HTTPS only in prod
    }
    res.cookie('jwt', token, cookieOptions);
  };

  private async validateEmail(email: string): Promise<Partial<User> | null> {
    const user = await userRepo.findOne({ where: { email } });
    if (!user) return null;
    return user;
  }

  signUp = async (req: Request): Promise<User> => {
    const userExist = await userRepo.findOne({
      where: [{ email: req.body.email }, { username: req.body.username }],
    });
    if (userExist) {
      throw new AppError(
        ERROR_MESSAGE.ALREADY_EXISTS('User with this email or username'),
        STATUS_CODE.NOT_FOUND,
      );
    }
    const otp = await this.createOtp(
      req.body.email,
      OTP_TYPE.EMAIL_VERIFICATION,
    );
    const user = userRepo.create({
      ...req.body,
    });
    await userRepo.save(user);

    const message = {
      to: user.email,
      subject: 'Welcome to Image Processor API',
      from: ENVIRONMENT.MAILER.FROM,
      body: emailService.signupEmailTemplate(otp, user.firstName),
    };
    await queueService.addJob(
      ENVIRONMENT.QUEUE.QUEUE_NAME,
      JOB_TYPES.SEND_EMAIL,
      message,
    );
    return user;
  };

  verifyEmail = async (req: Request): Promise<void> => {
    const { email, otp } = req.body;
    const otpRecord = await otpRepo.findOne({
      where: {
        identifier: email,
        type: OTP_TYPE.EMAIL_VERIFICATION,
        isUsed: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
    if (!otpRecord) {
      throw new AppError('OTP not found for this email', STATUS_CODE.NOT_FOUND);
    }
    if (otpService.isExpired(otpRecord.expiredAt)) {
      throw new AppError('OTP has expired', STATUS_CODE.BAD_REQUEST);
    }
    const user = await userRepo.findOne({
      where: { email },
    });
    if (!user) {
      throw new AppError(
        'User not found for this email',
        STATUS_CODE.NOT_FOUND,
      );
    }

    const now = new Date();

    const minutesSinceLastAttempt = differenceInMinutes(
      now,
      otpRecord.attempts,
    );

    const hasExceededAttempts = otpRecord.attempts >= this.MAX_OTP_ATTEMPTS;

    const isStillCoolingDown =
      minutesSinceLastAttempt < this.OTP_COOL_DOWN_MINUTES;

    if (hasExceededAttempts && isStillCoolingDown) {
      const remainingCooldownMinutes =
        this.OTP_COOL_DOWN_MINUTES - minutesSinceLastAttempt;

      throw new AppError(
        `Too many OTP verification attempts. Please try again in ${remainingCooldownMinutes} minute(s).`,
        STATUS_CODE.TOO_MANY_REQUESTS,
      );
    }

    const isValidOtp = otpService.verifyStrongHashed(otp, otpRecord.code);
    if (isValidOtp) {
      user.emailVerifiedAt = new Date();
      await userRepo.save(user);
      await otpRepo.delete({
        id: otpRecord.id,
      });

      const message = {
        to: user.email,
        subject: 'Welcome to Image Processor API',
        from: ENVIRONMENT.MAILER.FROM,
        body: emailService.welcomeEmailTemplate(user.firstName),
      };
      await queueService.addJob(
        ENVIRONMENT.QUEUE.QUEUE_NAME,
        JOB_TYPES.SEND_EMAIL,
        message,
      );
      return;
    }
    // Increment failed OTP attempts
    await otpRepo.findOneAndUpdate(
      {
        identifier: user.email,
        type: OTP_TYPE.EMAIL_VERIFICATION,
        isUsed: false,
      },
      {
        attempts: (otpRecord.attempts || 0) + 1,
      },
    );
    throw new AppError('Invalid OTP', STATUS_CODE.BAD_REQUEST);
  };

  resendOTP = async (req: Request): Promise<void> => {
    const { email } = req.body;

    const latestOtp = await otpRepo.findOne({
      where: {
        identifier: email,
        type: OTP_TYPE.EMAIL_VERIFICATION,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!latestOtp) {
      // Generate new OTP
      const otpCode = await this.createOtp(email, OTP_TYPE.EMAIL_VERIFICATION);
      const message = {
        to: email,
        subject: 'Your OTP Code for Email Verification',
        from: ENVIRONMENT.MAILER.FROM,
        body: emailService.signupEmailTemplate(otpCode, email),
      };
      await queueService.addJob(
        ENVIRONMENT.QUEUE.QUEUE_NAME,
        JOB_TYPES.SEND_EMAIL,
        message,
      );
      return;
    }

    // Check coolDown
    const secondsLeft = otpService.checkCoolDown(latestOtp.nextResendAt);
    if (secondsLeft !== null) {
      throw new AppError(
        `Please wait ${secondsLeft} seconds before requesting again.`,
        STATUS_CODE.TOO_MANY_REQUESTS,
      );
    }

    // Check max resend
    if (otpService.checkMaxResendAttempts(latestOtp.resendCount)) {
      throw new AppError(
        'Maximum resend attempts reached. Please request a new OTP after 24 hours.',
        STATUS_CODE.BAD_REQUEST,
      );
    }

    // Invalidate ALL unused OTPs for this email/type
    await otpRepo.update(
      {
        identifier: email,
        type: OTP_TYPE.EMAIL_VERIFICATION,
        isUsed: false,
      },
      {
        isUsed: true, // mark them as used so they can't be verified
        expiredAt: new Date(), // expire immediately
      },
    );

    // Generate new OTP
    const coolDown = otpService.coolDownSeconds(latestOtp.resendCount);
    const otpCode = await this.createOtp(email, OTP_TYPE.EMAIL_VERIFICATION);
    latestOtp.expiredAt = otpService.expiryTime(); // 10 mins
    latestOtp.resendCount = latestOtp.resendCount + 1;
    latestOtp.nextResendAt = new Date(Date.now() + coolDown * 1000);

    //TODO:
    /*
    1. Rate limit the endpoint itself as a first line of defence before even hitting the service logic — this stops bots from hammering the endpoint at the network level.
    */
    await otpRepo.save(latestOtp);
    const message = {
      to: req.body.email,
      subject: 'Your OTP Code for Email Verification',
      from: ENVIRONMENT.MAILER.FROM,
      body: emailService.signupEmailTemplate(otpCode, req.body.email),
    };
    await queueService.addJob(
      ENVIRONMENT.QUEUE.QUEUE_NAME,
      JOB_TYPES.SEND_EMAIL,
      message,
    );
    return;
  };

  private async createSession(session: CreateSession): Promise<Session> {
    const newSession = sessionRepo.create(session);
    return await sessionRepo.save(newSession);
  }

  private async validateUser(req: Request): Promise<Partial<User> | null> {
    const user = await userRepo.findOne({
      where: { email: req.body.email },
    });
    if (!user) return null;
    // Check login attempts and cool down
    const loginAttempts = user?.loginAttempts || {
      count: 0,
      lastAttempt: new Date(0),
    };

    const now = new Date();

    const minutesSinceLastAttempt = differenceInMinutes(
      now,
      loginAttempts.lastAttempt,
    );

    const hasExceededAttempts = loginAttempts.count >= this.MAX_LOGIN_ATTEMPTS;

    const isStillCoolingDown =
      minutesSinceLastAttempt < this.LOGIN_COOL_DOWN_MINUTES;

    if (hasExceededAttempts && isStillCoolingDown) {
      const remainingCooldownMinutes =
        this.LOGIN_COOL_DOWN_MINUTES - minutesSinceLastAttempt;

      throw new AppError(
        `Too many login attempts. Please try again in ${remainingCooldownMinutes} minute(s).`,
        STATUS_CODE.TOO_MANY_REQUESTS,
      );
    }

    if (user && (await user.validatePassword(req.body.password))) {
      // Reset login attempts on successful login
      await userRepo.findOneAndUpdate(
        { id: user.id },
        {
          loginAttempts: { count: 0, lastAttempt: new Date() },
        },
      );
      return user;
    }
    // Increment failed login attempts
    await userRepo.findOneAndUpdate(
      { id: user.id },
      {
        loginAttempts: {
          count: (loginAttempts.count || 0) + 1,
          lastAttempt: new Date(),
        },
      },
    );

    return null;
  }

  login = async (
    req: Request,
  ): Promise<{
    accessToken?: string;
    refreshToken?: string;
    message?: string;
    tokenExpiresInSeconds?: number;
    refreshExpiresInSeconds?: number;
    requiresVerification?: boolean;
    userVerificationExpiresAt?: Date;
    session?: string;
    user: Partial<User>;
  }> => {
    const validUser = await this.validateUser(req);
    if (!validUser) {
      throw new AppError('Invalid credentials', STATUS_CODE.NOT_FOUND);
    }
    if (!validUser.emailVerifiedAt) {
      const registrationTime = validUser.createdAt || new Date();
      const userVerificationExpiryTime = addMinutes(
        registrationTime,
        this.UNVERIFIED_USER_EXPIRY_HOURS * 60,
      );
      const now = new Date();
      if (now > userVerificationExpiryTime) {
        // Delete unverified user after 24 hours
        await userRepo.delete({ id: validUser.id });
        throw new AppError(
          'Registration expired. Please register again.',
          STATUS_CODE.UNAUTHORIZED,
        );
      }
      // Resend verification email if user tries to login
      const otp = await this.createOtp(
        validUser?.email as string,
        OTP_TYPE.EMAIL_VERIFICATION,
      );
      const message = {
        to: validUser?.email,
        subject: 'Welcome to Image Processor API',
        from: ENVIRONMENT?.MAILER.FROM,
        body: emailService.signupEmailTemplate(
          otp,
          validUser.firstName as string,
        ),
      };
      await queueService.addJob(
        ENVIRONMENT.QUEUE.QUEUE_NAME,
        JOB_TYPES.SEND_EMAIL,
        message,
      );
      return {
        message: 'Please check your email to verify your account',
        user: {
          id: validUser.id,
          email: validUser.email,
          emailVerifiedAt: validUser.emailVerifiedAt,
          firstName: validUser.firstName,
          lastName: validUser.lastName,
        },
      };
    }

    // Check concurrent sessions
    const userSessions = await sessionRepo.findAll({
      where: { userId: validUser.id },
      order: { lastSeenAt: 'ASC' },
    });

    if (userSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
      const oldestSession = userSessions[0];

      // Kill the oldest session
      await sessionRepo.update(
        { id: oldestSession.id },
        { expiresAt: new Date() }, // Expire it now
      );

      // OR delete it
      // await sessionRepo.delete({ id: oldestSession.id });
    }

    const token = await jwtService.generateToken({ id: validUser.id });
    const refresh = await jwtService.generateToken(
      { sub: validUser.id },
      ENVIRONMENT.JWT.refreshTokenExpiryInSeconds,
    );
    // create session
    const session = await this.createSession({
      userId: validUser.id as string,
      userAgent: req.headers['user-agent'] || ('' as string),
      ipAddress: req.ip || req.socket.remoteAddress || ('' as string),
      deviceName: req.headers['user-agent'] || ('' as string),
      lastSeenAt: new Date(),
      refreshToken: refresh,
      expiresAt: addSeconds(
        new Date(),
        ENVIRONMENT.JWT.refreshTokenExpiryInSeconds,
      ),
      //expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
    });
    auditEvents.emit('audit', {
      action: AuditAction.LOGIN,
      userId: validUser.id,
      timestamp: new Date(),
      ipAddress: req.ip || req.socket.remoteAddress || ('' as string),
      userAgent: req.headers['user-agent'] || ('' as string),
      module: AuditModule.AUTH,
      userEmailSnapshot: validUser.email,
      userRoleSnapshot: validUser.role,
      metadata: { email: validUser.email, role: validUser.role, sessionId: session.id },
    });
    return {
      accessToken: token,
      tokenExpiresInSeconds: ENVIRONMENT.JWT.accessTokenExpiryInSeconds,
      refreshToken: refresh,
      refreshExpiresInSeconds: ENVIRONMENT.JWT.refreshTokenExpiryInSeconds,
      session: session.id,
      user: {
        id: validUser.id,
        email: validUser.email,
        emailVerifiedAt: validUser.emailVerifiedAt,
        firstName: validUser.firstName,
        lastName: validUser.lastName,
      },
    };
  };

  refreshHandler = async (
    req: Request,
  ): Promise<{
    accessToken: string;
    userId: string;
    session: string;
    tokenExpiresInSeconds: number;
    refreshToken: string;
    refreshExpiresInSeconds: number;
  }> => {
    const { refreshToken } = req.cookies; // from HttpOnly cookie
    if (!refreshToken)
      throw new AppError('Missing refresh token', STATUS_CODE.UNAUTHORIZED);

    const session = await sessionRepo.findOne({
      where: { id: req.body.sessionId, userId: req.body.userId },
    });
    if (!session)
      throw new AppError('Invalid refresh token', STATUS_CODE.UNAUTHORIZED);

    const validSession = await session.validateRefreshToken(refreshToken);
    if (!validSession)
      throw new AppError('Invalid refresh token', STATUS_CODE.UNAUTHORIZED);

    const isExpired = session.expiresAt < new Date();
    if (isExpired)
      throw new AppError(
        'Refresh token expired! Please login again',
        STATUS_CODE.UNAUTHORIZED,
      );

    const isRevoke = session.revokedAt !== null;
    if (isRevoke)
      throw new AppError(
        'Refresh token revoked! Please login again',
        STATUS_CODE.UNAUTHORIZED,
      );

    // Rotation: Revoke old, issue new. Prevents replay attacks
    await sessionRepo.findOneAndUpdate(
      { id: session.id },
      { revokedAt: new Date() },
    );

    const newRefreshToken = await jwtService.generateToken(
      { sub: session.userId },
      ENVIRONMENT.JWT.refreshTokenExpiryInSeconds,
    );
    const accessToken = await jwtService.generateToken(
      { id: session.userId },
      ENVIRONMENT.JWT.accessTokenExpiryInSeconds,
    );

    // Update last_seen_at
    await sessionRepo.findOneAndUpdate(
      { id: session.id },
      { lastSeenAt: new Date(), refreshToken: newRefreshToken },
    );
    return {
      accessToken,
      userId: session.userId,
      session: session.id,
      tokenExpiresInSeconds: ENVIRONMENT.JWT.accessTokenExpiryInSeconds,
      refreshToken: newRefreshToken,
      refreshExpiresInSeconds: ENVIRONMENT.JWT.refreshTokenExpiryInSeconds,
    };
  };

  logoutHandler = async (req: Request): Promise<Session> => {
    const sessions = await sessionRepo.findOne({
      where: {
        userId: req.body.userId,
        id: req.body.sessionId,
        revokedAt: IsNull(),
      },
    });
    if (sessions?.revokedAt === null) {
      sessions.revokedAt = new Date();
      return await sessionRepo.save(sessions);
    }
    throw new AppError('Session not found', STATUS_CODE.NOT_FOUND);
  };

  logoutAllHandler = async (req: Request): Promise<Session> => {
    const sessions = await sessionRepo.findOneAndUpdate(
      { userId: req.body.userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    if (sessions) {
      return sessions;
    }
    throw new AppError('Session not found', STATUS_CODE.NOT_FOUND);
  };

  forgotPassword = async (req: Request): Promise<User | null> => {
    const { email } = req.body;
    const user = await userRepo.findOne({ where: { email } });
    if (user) {
      const otpRecord = await otpRepo.findOne({
        where: {
          identifier: email,
          type: OTP_TYPE.PASSWORD_RESET_REQUEST,
          isUsed: false,
        },
      });

      if (!otpRecord) {
        const otpCode = await this.createOtp(
          email,
          OTP_TYPE.PASSWORD_RESET_REQUEST,
        );
        const message = {
          to: req.body.email,
          subject: 'Your OTP for password reset',
          from: ENVIRONMENT.MAILER.FROM,
          body: emailService.resetPasswordEmailTemplate(
            otpCode,
            user.firstName,
          ),
        };
        await queueService.addJob(
          ENVIRONMENT.QUEUE.QUEUE_NAME,
          JOB_TYPES.SEND_EMAIL,
          message,
        );
        return user;
      }
      // Check coolDown
      const secondsLeft = otpService.checkCoolDown(otpRecord.nextResendAt);
      if (secondsLeft !== null) {
        throw new AppError(
          `Please wait ${secondsLeft} seconds before requesting again.`,
          STATUS_CODE.TOO_MANY_REQUESTS,
        );
      }

      // Check max resend
      if (otpService.checkMaxResendAttempts(otpRecord.resendCount)) {
        throw new AppError(
          'Maximum resend attempts reached. Please request a new OTP after 24 hours.',
          STATUS_CODE.BAD_REQUEST,
        );
      }

      // Generate new OTP
      const coolDown = otpService.coolDownSeconds(otpRecord.resendCount);
      const otpCode = await this.createOtp(
        email,
        OTP_TYPE.PASSWORD_RESET_REQUEST,
      );
      otpRecord.expiredAt = otpService.expiryTime(); // 10 mins
      otpRecord.resendCount = otpRecord.resendCount + 1;
      otpRecord.nextResendAt = new Date(Date.now() + coolDown * 1000);

      //TODO:
      /*
    1. Rate limit the endpoint itself as a first line of defence before even hitting the service logic — this stops bots from hammering the endpoint at the network level.
    */
      await otpRepo.save(otpRecord);
      const message = {
        to: req.body.email,
        subject: 'Your OTP for password reset',
        from: ENVIRONMENT.MAILER.FROM,
        body: emailService.resetPasswordEmailTemplate(otpCode, user.firstName),
      };
      await queueService.addJob(
        ENVIRONMENT.QUEUE.QUEUE_NAME,
        JOB_TYPES.SEND_EMAIL,
        message,
      );
      return user;
    }
    return null;
  };

  resetPassword = async (req: Request) => {
    const { otp, email, newPassword } = req.body;

    // Find all non-expired, unused tokens
    const token = await otpRepo.findAll({
      where: {
        isUsed: false,
        type: OTP_TYPE.PASSWORD_RESET_REQUEST,
        identifier: email,
      },
    });
    let valid = null;
    for (const tk of token) {
      if (otpService.verifyStrongHashed(otp, tk.code)) {
        valid = tk;
        break;
      }
    }
    if (!valid)
      throw new AppError('Invalid or expired link', STATUS_CODE.BAD_REQUEST);

    if (valid.expiredAt < new Date())
      throw new AppError('Invalid or expired link', STATUS_CODE.BAD_REQUEST);

    // Update password
    const user = await userRepo.findOne({ where: { email: valid.identifier } });
    if (!user) throw new AppError('User not found', STATUS_CODE.NOT_FOUND);

    user.password = await bcrypt.hash(newPassword, this.SALT_ROUND);
    await userRepo.save(user);

    // Burn the token
    await otpRepo.delete({ id: valid.id });

    // Logout everywhere
    await sessionRepo.update(
      { userId: user.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return user;
  };
}
