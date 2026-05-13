import CryptoJS from 'crypto-js';
import * as crypto from 'crypto';
import { ENV_CONFIG } from '../../config';
import { STATUS_CODE } from '../constants';
import AppError from '../utils/errors/appError';
export class OTPService {
  private readonly tenMinutesInMs: number = 10 * 60 * 1000;
  private readonly fiveMinutesInMs: number = 5 * 60 * 1000;
  private readonly oneMinuteInMs: number = 60 * 1000;
  private readonly otpExpiry: number = this.tenMinutesInMs;
  private readonly secretKey: string = ENV_CONFIG.APP.ENCRYPTION_KEY;
  private readonly OTP_LENGTH = 6;
  private readonly MAX_OTP_GENERATION_ATTEMPTS = 3;
  private readonly OTP_GENERATION_INTERVAL = this.oneMinuteInMs;

  generateOTP(): string {
    try {
      // Generate a cryptographically secure random number
      const randomBytes = crypto.randomBytes(4); // 4 bytes = 32 bits
      const randomNumber = randomBytes.readUInt32BE(0);

      // Convert to a 6-digit number (000000-999999)
      const otp = (randomNumber % 1000000).toString().padStart(6, '0');
      return otp;
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw new AppError(
        'Failed to generate OTP',
        STATUS_CODE.INTERNAL_SERVER_ERROR,
      );
    }
  }

  strongHashOtp(otp: string): string {
    try {
      // HMAC uses your secretKey so rainbow tables won't work
      return CryptoJS.HmacSHA256(otp.trim(), this.secretKey.trim()).toString(
        CryptoJS.enc.Hex,
      );
    } catch (error) {
      console.error('Error hashing OTP:', error);
      throw new AppError(
        'Failed to hash OTP',
        STATUS_CODE.INTERNAL_SERVER_ERROR,
      );
    }
  }

  verifyStrongHashedOtp(plainOtp: string, hashedOtp: string): boolean {
    try {
      const computedHash = CryptoJS.HmacSHA256(
        plainOtp.trim(),
        this.secretKey.trim(),
      ).toString(CryptoJS.enc.Hex);

      return computedHash === hashedOtp.trim();
    } catch (error) {
      console.error('Error verifying hashed OTP:', error);
      return false;
    }
  }

  weakHashOtp(otp: string): string {
    try {
      const hashedOtp = CryptoJS.SHA256(otp).toString();
      return hashedOtp;
    } catch (error) {
      console.error('Error hashing OTP:', error);
      throw new AppError(
        'Failed to hash OTP',
        STATUS_CODE.INTERNAL_SERVER_ERROR,
      );
    }
  }

  verifyWeakHashedOtp(hashedOtp: string, otpToVerify: string): boolean {
    try {
      console.debug('Verifying hashed OTP');
      const hashedInput = this.weakHashOtp(otpToVerify);
      const isValid = hashedOtp === hashedInput;
      console.debug(
        `Hashed OTP verification ${isValid ? 'successful' : 'failed'}`,
      );
      return isValid;
    } catch (error) {
      console.error('Error verifying hashed OTP:', error);
      return false;
    }
  }

  encryptOtp(otp: string, email: string): string {
    try {
      const timestamp = new Date().getTime();
      const data = `${otp}|${email}|${timestamp}`;
      const encryptedData = CryptoJS.AES.encrypt(
        data,
        this.secretKey,
      ).toString();
      return encryptedData;
    } catch (error) {
      console.error('Error encrypting OTP:', error);
      throw new AppError(
        'Failed to encrypt OTP',
        STATUS_CODE.INTERNAL_SERVER_ERROR,
      );
    }
  }

  verifyEncryptedOtp(
    encryptedOtp: string,
    otpToVerify: string,
    email: string,
  ): boolean {
    try {
      // Decrypt the OTP data
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedOtp, this.secretKey);
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);

      // Split the data
      const [originalOtp, originalEmail, timestamp] = decryptedData.split('|');

      // Check if OTP is expired
      const otpTime = parseInt(timestamp, 10);
      const currentTime = new Date().getTime();
      if (currentTime - otpTime > this.otpExpiry) {
        console.debug('OTP verification failed: OTP expired');
        return false; // OTP expired
      }

      // Verify OTP and email
      const isValid = originalOtp === otpToVerify && originalEmail === email;
      console.debug(`OTP verification ${isValid ? 'successful' : 'failed'}`);
      return isValid;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }

  isOtpExpired(expirationTime: Date): boolean {
    const currentTime = new Date();
    const isExpired =
      new Date(expirationTime).getTime() < currentTime.getTime();
    if (isExpired) {
      return true;
    }
    return false;
  }

  calculateOtpExpiration(expirationTimeInMinutes: number = 10): Date {
    return new Date(Date.now() + expirationTimeInMinutes * 60 * 1000);
  }

  getOtpExpiryTime(): Date {
    return new Date(Date.now() + this.otpExpiry);
  }
}
