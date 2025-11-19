import {
    Between,
    DeepPartial,
    FindManyOptions,
    FindOneOptions,
    FindOptionsOrder,
    FindOptionsWhere,
    Repository
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { PaginatedQuery } from '../shared/types/paginate.type';
import { dbTimeStamp } from '../shared/utils';
import BaseEntity from '../repositories/base.entity';
import AppError from '../shared/utils/errors/appError';
import { STATUS_CODE } from '../shared/constants';

export default abstract class BaseRepository<T extends BaseEntity> {
    protected entity: Repository<T>;

    constructor(_entity: Repository<T>) {
        this.entity = _entity;
    }

    get entityName(): string {
        return this.entity.metadata.name;
    }

    async save(data: DeepPartial<T>): Promise<T> {
        return this.entity.save(data as any);
    }

    async findOne(options: FindOneOptions<T>): Promise<T | null> {
        return this.entity.findOne(options);
    }

    async findOneAndUpdate(
        where: FindOptionsWhere<T>,
        partialEntity: QueryDeepPartialEntity<T>,
        returnEntity = true
    ): Promise<T | null | void> {
        // <-- allow null
        const updateResult = await this.entity.update(where, partialEntity);
        if (!updateResult.affected) {
            console.warn('Entity not found with where', where);
            throw new AppError('Entity not found.', STATUS_CODE.NOT_FOUND);
        }

        if (!returnEntity) {
            return; // returns undefined (void)
        }

        const filter = { ...where, ...(partialEntity as object) } as
            | FindOptionsWhere<T>
            | FindOptionsWhere<T>[];

        return this.findOne({ where: filter }); // may be T or null
    }

    async findPaginated(
        {
            currentPage,
            pageSize,
            filter,
            filterBy,
            order,
            orderBy,
            from,
            to,
            field
        }: PaginatedQuery,
        options?: FindManyOptions<T>
    ) {
        pageSize = pageSize || 10;
        currentPage = currentPage || 1;
        const offset = (currentPage - 1) * pageSize;

        let where: FindOptionsWhere<T> | FindOptionsWhere<T>[] = {
            ...(options?.where as object)
        } as FindOptionsWhere<T>;

        const orderRelation = {
            [orderBy || dbTimeStamp.createdAt]: (order || 'DESC') as
                | 'ASC'
                | 'DESC'
        } as FindOptionsOrder<T>;

        if (filter !== undefined && filterBy) {
            let parsed: string | boolean;

            if (filter === 'true') {
                parsed = true;
            } else if (filter === 'false') {
                parsed = false;
            } else {
                parsed = filter;
            }

            where = {
                ...(where as object),
                [filterBy]: parsed
            } as FindOptionsWhere<T>;
        }

        if (from !== undefined && to !== undefined) {
            if (field) {
                where = {
                    ...(where as object),
                    [field]: Between(from, to)
                } as FindOptionsWhere<T>;
            } else {
                where = {
                    ...(where as object),
                    [dbTimeStamp.createdAt]: Between(from, to)
                } as FindOptionsWhere<T>;
            }
        }

        const [data, total] = await this.entity.findAndCount({
            take: pageSize,
            skip: offset,
            where: {
                ...(where as object)
            } as any,
            order: {
                ...(orderRelation as any)
            },
            ...options
        });

        return {
            data,
            pagination: {
                total,
                pageSize,
                currentPage
            }
        };
    }

    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        return this.entity.find(options);
    }

    async delete(where: FindOptionsWhere<T>) {
        const res = await this.entity.delete(where);

        if (!res.affected) {
            console.warn('Entity not found with where', where);
            throw new AppError('Entity not found.', STATUS_CODE.NOT_FOUND);
        }

        return {
            status: !!res.affected
        };
    }

    /**
     * Full text-like search across multiple columns using LIKE.
     * - keyword: search term
     * - columns: list of columns (strings) on the entity
     * - entityName: alias used in queryBuilder
     */
    async search(
        keyword: string,
        columns: string[],
        entityName: string,
        where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
        relations?: string,
        pageSize = 10,
        currentPage = 1
    ) {
        const qb = this.createQueryBuilder(entityName);
        const offset = (currentPage - 1) * pageSize;

        // build where conditions for columns
        const whereConditions = columns.map(
            (column) => `${entityName}.${column} LIKE :term`
        );

        qb.where(`(${whereConditions.join(' OR ')})`, {
            term: `%${keyword}%`
        });

        // additional where(s)
        if (where) {
            if (Array.isArray(where)) {
                where.forEach((condition) => {
                    qb.orWhere(
                        `(${this.buildConditionString(condition, entityName)})`,
                        {
                            ...condition
                        }
                    );
                });
            } else {
                qb.andWhere(
                    `(${this.buildConditionString(where, entityName)})`,
                    {
                        ...where
                    }
                );
            }
        }

        if (relations) {
            qb.leftJoinAndSelect(`${entityName}.${relations}`, relations);
        }

        const [data, total] = await Promise.all([
            qb.take(pageSize).skip(offset).getMany(),
            qb.getCount()
        ]);

        return {
            data,
            pagination: {
                total,
                pageSize,
                currentPage
            }
        };
    }

    buildConditionString(
        condition: FindOptionsWhere<T>,
        entityName?: string
    ): string {
        const keys = Object.keys(condition || {});
        if (keys.length === 0) return '1=1';
        let conditions = keys.map((key) => `${key} = :${key}`);
        if (entityName) {
            conditions = keys.map((key) => `${entityName}.${key} = :${key}`);
        }
        return conditions.join(' AND ');
    }

    public async count(options?: FindManyOptions<T>) {
        return this.entity.count(options);
    }

    createQueryBuilder(alias?: string) {
        return this.entity.createQueryBuilder(alias);
    }

    public async saveMany(data: DeepPartial<T>[]): Promise<T[]> {
        return this.entity.save(data as any);
    }

    public create(data: DeepPartial<T>): T {
        return this.entity.create(data as any) as unknown as T;
    }

    public createMany(data: DeepPartial<T>[]): T[] {
        return this.entity.create(data as any);
    }
}
