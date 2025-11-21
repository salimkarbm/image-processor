import {
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn
} from 'typeorm';

export default abstract class BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @CreateDateColumn({
        type: 'timestamptz',
        select: false,
        default: () => 'CURRENT_TIMESTAMP'
    })
    createdAt!: Date;

    @UpdateDateColumn({
        type: 'timestamptz',
        select: false,
        default: () => 'CURRENT_TIMESTAMP'
    })
    updatedAt!: Date;

    @VersionColumn({
        select: false,
        comment: 'System‑managed optimistic‑locking column'
    })
    rowVersion!: number;
}
