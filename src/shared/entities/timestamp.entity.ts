import {
    CreateDateColumn,
    UpdateDateColumn,
    VersionColumn,
    BaseEntity
} from 'typeorm';

export default class TimeStampWithSchema extends BaseEntity {
    @CreateDateColumn({ select: false })
    createdAt?: Date;

    @UpdateDateColumn({ select: false })
    updatedAt?: Date;

    @VersionColumn({
        select: false,
        comment: 'System‑managed optimistic‑locking column'
    })
    rowVersion!: number;
}
