import { EmailMessageOptions, SendEmailOptions } from '../types';
import nodemailer from 'nodemailer';
import { convert } from 'html-to-text';
import { ENVIRONMENT } from '../../config';
import { SignupOtpTemplate, WelcomeEmailTemplate } from '../templates';
import { ResetPasswordEmailTemplate } from '../templates/reset-password';

export class EmailService {
  async nodemailerConfig(
    options: EmailMessageOptions,
  ): Promise<nodemailer.SentMessageInfo> {
    const transporter: nodemailer.Transporter = nodemailer.createTransport({
      // service: ENVIRONMENT.MAILER.NAME,
      host: ENVIRONMENT.MAILER.HOST,
      port: Number(ENVIRONMENT.MAILER.PORT),
      secure: false,
      auth: {
        user: ENVIRONMENT.MAILER.USERNAME,
        pass: ENVIRONMENT.MAILER.PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // ← helps locally
      },
    });
    try {
      // send the email with nodemailer
      const result: nodemailer.SentMessageInfo =
        await transporter.sendMail(options);
      return result;
    } catch (error: any) {
      console.error('Error sending email:', error);
      if (error.response) {
        console.error(error.response.body);
      }
      throw error;
    }
  }

  private convertEmailToText = (html: string) => {
    const result: string = convert(html, {
      wordwrap: 150,
    });
    return result;
  };

  async sendEmail(
    options: EmailMessageOptions,
    template: string,
  ): Promise<nodemailer.SentMessageInfo> {
    // convert email in HTML to plain text
    const text: string = this.convertEmailToText(template);
    const msg: EmailMessageOptions = {
      to: options.to,
      from: options.from || ENVIRONMENT.MAILER.FROM,
      subject: options.subject,
      html: template,
      text,
    };
    switch (ENVIRONMENT.APP.env) {
      case 'production':
        return await this.nodemailerConfig(msg);
      case 'staging':
        return await this.nodemailerConfig(msg);
      default:
        return await this.nodemailerConfig(msg);
    }
  }

  /**
   * Attempts to send a email to the user with retry logic.
   * Returns true if sent successfully, false if all retries failed.
   */
  async retryEmail(
    message: EmailMessageOptions,
    sendMail: any,
  ): Promise<boolean> {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const sent = await sendMail(message);

        if (sent) {
          console.log(
            `Welcome email sent to ${message.to} on attempt ${attempt}`,
          );
          return true;
        }

        console.warn(
          `Welcome email returned false for ${message.to}, attempt ${attempt}/${maxRetries}`,
        );
      } catch (error) {
        console.error(
          `Attempt ${attempt}/${maxRetries} failed for ${message.to}:`,
          error,
        );
      }

      // Don't sleep after the last attempt
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // exponential backoff
      }
    }

    console.error(
      `Failed to send welcome email to ${message.to} after ${maxRetries} attempts`,
    );
    return false; // Explicit failure
  }

  signupEmailTemplate(otp: string, firstName: string): string {
    return SignupOtpTemplate({
      firstName,
      otp,
      expiryMinutes: ENVIRONMENT.OTP.EXPIRY_TIME_IN_MINUTES,
      appName: ENVIRONMENT.APP.name,
      appTagline: ENVIRONMENT.APP.tagline,
      teamName: ENVIRONMENT.APP.teamName,
    });
  }

  async signupOTPEmail(
    message: EmailMessageOptions,
    options: SendEmailOptions,
  ): Promise<nodemailer.SentMessageInfo> {
    const template: string = this.signupEmailTemplate(
      options.otp as string,
      options.firstName as string,
    );
    return await this.sendEmail(message, template);
  }

  welcomeEmailTemplate(firstName: string): string {
    return WelcomeEmailTemplate({
      firstName,
      appName: ENVIRONMENT.APP.name,
      appTagline: ENVIRONMENT.APP.tagline,
      teamName: ENVIRONMENT.APP.teamName,
      dashboardUrl: ENVIRONMENT.APP.dashboardUrl,
      helpUrl: ENVIRONMENT.APP.helpUrl,
      companyAddress: ENVIRONMENT.APP.companyAddress,
      unsubscribeUrl: ENVIRONMENT.APP.unsubscribeUrl,
    });
  }

  resetPasswordEmailTemplate(otp: string, firstName: string): string {
    return ResetPasswordEmailTemplate({
      firstName,
      otp,
      expiryMinutes: ENVIRONMENT.OTP.EXPIRY_TIME_IN_MINUTES,
      appName: ENVIRONMENT.APP.name,
      appTagline: ENVIRONMENT.APP.tagline,
      teamName: ENVIRONMENT.APP.teamName,
      helpUrl: ENVIRONMENT.APP.helpUrl,
      companyAddress: ENVIRONMENT.APP.companyAddress,
      resetPasswordUrl: ENVIRONMENT.APP.resetPasswordUrl,
    });
  }

  async sendWelcomeEmail(
    message: EmailMessageOptions,
    option: SendEmailOptions,
  ): Promise<nodemailer.SentMessageInfo> {
    const template: string = this.welcomeEmailTemplate(
      option.firstName as string,
    );
    return await this.sendEmail(message, template);
  }

  async sendResetPasswordEmail(
    message: EmailMessageOptions,
    options: SendEmailOptions,
  ): Promise<nodemailer.SentMessageInfo> {
    const template: string = this.resetPasswordEmailTemplate(
      options.otp as string,
      options.firstName as string,
    );
    return await this.sendEmail(message, template);
  }
}

const emailService = new EmailService();
export default emailService;
