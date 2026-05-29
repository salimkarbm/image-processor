import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import BaseEntity from '../../repositories/base.entity';

@Entity({ name: 'otp', schema: 'public' })
export default class OTP extends BaseEntity {
  @Column({
    comment:
      'Type of OTP, either for phone number verification or email verification',
  })
  type!: string;

  @Column({
    type: 'text',
    comment: 'The OTP code, stored as a hashed value for security',
  })
  code!: string;

  @Column({ comment: 'The timestamp when the OTP expires' })
  expiredAt!: Date;

  @Column({
    comment: 'The identifier for the user or entity associated with the OTP',
  })
  identifier!: string;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Number of times the OTP has been resent',
  })
  resendCount!: number; // how many times they've resent

  @Column({
    type: 'timestamptz',
    nullable: true,
    comment: 'The timestamp when the next OTP can be resent',
  })
  nextResendAt!: Date | null; // earliest they can request again

  @Column({
    type: 'int',
    default: 0,
    comment: 'Number of wrong OTP entry attempts',
  })
  attempts!: number; // wrong OTP entry attempts

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indicates if the OTP has been used',
  })
  isUsed!: boolean; // has it been consumed
}
