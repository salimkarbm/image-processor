import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert,
    BeforeUpdate
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import BaseEntity from '../../repositories/base.entity';

@Entity('users')
export default class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true, nullable: false, comment: 'User email address' })
    email!: string;

    @Column({ nullable: false, comment: 'User role', default: 'user' })
    role!: string;

    @Column({ nullable: false, comment: 'User password' })
    password!: string;

    @Column({
        nullable: false,
        comment: 'User full name'
    })
    fullName!: string;

    @Column({
        nullable: false,
        comment: 'User active status',
        default: false
    })
    isActive!: boolean;

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
