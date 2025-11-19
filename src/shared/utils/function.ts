import { PaginatedResponse } from '../types/paginate.type';

export const dbTimeStamp = {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};

export const paginate = <T>(
    array: T[],
    page: number,
    limit: number
): PaginatedResponse<T> => {
    const offset = (page - 1) * limit;
    const paginatedData = array.slice(offset, offset + limit);
    const totalItems = array.length;
    const totalPages = Math.ceil(totalItems / limit);

    return {
        data: paginatedData,
        pagination: {
            page,
            limit,
            totalPages,
            totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
};
