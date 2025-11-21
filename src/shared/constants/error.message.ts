export const ERRORS = () => {
    return {
        NOT_FOUND: (name: string, id?: string) => {
            if (!id) {
                return `${name} not found`;
            }
            return `${name} with ID: ${id} not found`;
        },
        BAD_REQUEST: 'BAD REQUEST',
        UNAUTHORIZED: 'You are not authorized to perform this action',
        FORBIDDEN: 'FORBIDDEN',
        CONFLICT: 'CONFLICT',
        SERVER_ERROR: 'SERVER ERROR',
        ALREADY_EXISTS: (name: string) => `${name} already exists`,
        PASSWORD_MISMATCH: 'Passwords do not match',
        INCORRECT_CREDENTIALS: 'INCORRECT CREDENTIALS',
        INCORRECT_PASSWORD: 'INCORRECT PASSWORD',
        INCORRECT_EMAIL: 'INCORRECT EMAIL'
    };
};

export const ERROR_MESSAGE = ERRORS();
