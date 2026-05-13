import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { otpType } from '../../shared/enums/otp.enum';
import BaseEntity from '../../repositories/base.entity';

@Entity({ name: 'otp', schema: 'public' })
export default class OTP extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({
    type: 'enum',
    enum: otpType,
    comment:
      'Type of OTP, either for phone number verification or email verification',
  })
  type!: otpType;

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
}
