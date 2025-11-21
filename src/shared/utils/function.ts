import { Response } from 'express';
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

export const HttpResponse = ({
    response,
    data,
    status = 200,
    message = 'Request successful'
}: {
    status?: number;
    message?: string;
    data: any;
    response: Response;
}) => {
    return response.status(status).json({ data, message });
};
