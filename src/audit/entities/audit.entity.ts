import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import User from '../../users/entities/user.entity';
import { AuditAction, AuditModule } from '../../shared/enums/index';
import BaseEntity from '../../repositories/base.entity';

@Entity({ name: 'audit_logs', schema: 'public' })
export class AuditLog extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action!: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditModule,
  })
  module!: AuditModule;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata!: Record<string, any>;

  @Column({ nullable: true })
  ipAddress!: string;

  @Column({ nullable: true })
  userEmailSnapshot!: string;

  @Column({ nullable: true })
  userRoleSnapshot!: string;

  @Column({ nullable: true })
  userAgent!: string;
}
