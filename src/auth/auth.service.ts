import { Request } from 'express';
import UserRepository from '../repositories/user/user.repository';
import { AppDataSource } from '../config/typeorm.config';
import AppError from '../shared/utils/errors/appError';
import { ERROR_MESSAGE, STATUS_CODE } from '../shared/constants';
import { EmailService } from '../shared/services/email.service';
import { OTPService } from '../shared/services/otp.service';
import { ENV_CONFIG } from '../config';
import User from '../users/entities/user.entity';
import OTPRepository from '../repositories/user/otp.repository';
import OTP from '../users/entities/otp.entity';
import { otpType } from '../shared/enums/otp.enum';

const userRepo = new UserRepository(AppDataSource.manager);
const otpRepo = new OTPRepository(AppDataSource.manager);
const emailService = new EmailService();
const otpService = new OTPService();

export class UserService {
  private createOtp = async (
    identifier: string,
    type: otpType,
  ): Promise<string> => {
    const otpCode = otpService.generateOTP();
    const hashedOtp = otpService.strongHashOtp(otpCode);
    const otp = otpRepo.create({
      identifier,
      type,
      code: hashedOtp,
      expiredAt: otpService.calculateOtpExpiration(ENV_CONFIG.OTP.EXPIRY_TIME),
    });
    await otpRepo.save(otp);
    return otpCode;
  };

  private sendVerificationEmail = async (
    user: User,
    otp: string,
    message: any,
  ) => {
    try {
      const sendEmail = await emailService.signupOtpEmail(
        message,
        parseInt(otp, 10),
        user.firstName,
      );
      // retry ONLY if sending failed
      if (sendEmail.rejected.length > 0) {
        await emailService.retryEmail(
          message,
          emailService.signupOtpEmail.bind(emailService),
        );
      }
      return sendEmail;
    } catch (error) {
      // retry ONLY when email sending throws error
      // await emailService.retryEmail(message, sendEmail);

      // optional: remove user if email completely fails
      await userRepo.delete({
        id: user.id,
      });

      await otpRepo.delete({
        identifier: user.email,
      });

      throw new AppError(
        'Failed to send verification email',
        STATUS_CODE.INTERNAL_SERVER_ERROR,
      );
    }
  };

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
    const otp = await this.createOtp(req.body.email, otpType.email);
    const user = userRepo.create({
      ...req.body,
    });
    await userRepo.save(user);

    const message = {
      to: user.email,
      subject: 'Welcome to Image Processor API',
      from: ENV_CONFIG.MAILER.FROM,
    };
    //TODO: move this to a background job to avoid blocking the main thread, and implement retry logic for email sending, if email sending fails, delete the user and otp record to maintain data integrity
    await this.sendVerificationEmail(user, otp, message);
    return user;
  };

  verifyEmail = async (req: Request): Promise<void> => {
    const { email, otp } = req.body;
    const otpRecord = await otpRepo.findOne({
      where: {
        identifier: email,
        type: otpType.email,
      },
    });
    if (!otpRecord) {
      throw new AppError('OTP not found for this email', STATUS_CODE.NOT_FOUND);
    }
    if (otpService.isOtpExpired(otpRecord.expiredAt)) {
      throw new AppError('OTP has expired', STATUS_CODE.BAD_REQUEST);
    }
    const isValidOtp = otpService.verifyStrongHashedOtp(otp, otpRecord.code);
    if (!isValidOtp) {
      throw new AppError('Invalid OTP code', STATUS_CODE.BAD_REQUEST);
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
    user.isVerified = true;
    await userRepo.save(user);
    await otpRepo.delete({
      id: otpRecord.id,
    });
  };
}
