import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import BaseEntity from '../../repositories/base.entity';
import * as bcrypt from 'bcrypt';

@Entity({ name: 'session', schema: 'public' })
export default class Session extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  refreshToken!: string;

  @Column({ type: 'text' })
  userAgent!: string;

  @Column({ type: 'text' })
  ipAddress!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt?: Date | null;

  @Column({ type: 'text' })
  deviceName!: string;

  @Column({ type: 'timestamptz' })
  lastSeenAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashRefreshToken() {
    if (this.refreshToken && !this.refreshToken.startsWith('$2')) {
      // bcrypt hashes begin with $2a/$2b/$2y
      const salt = await bcrypt.genSalt();
      this.refreshToken = await bcrypt.hash(this.refreshToken, salt);
    }
  }

  async validateRefreshToken(refreshToken: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(refreshToken, this.refreshToken);
    return isMatch;
  }
}
