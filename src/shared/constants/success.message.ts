export const MESSAGES = () => {
    return {
        CREATED: (name: string) => `${name} created successfully`,
        UPDATED: (name: string) => `${name} updated successfully`,
        FETCHED: (name: string) => `${name} fetched successfully`,
        DELETED: (name: string) => `${name} deleted successfully`,
        LOGIN: `Logged in successful`,
        SIGN_UP: `Account signed up successfully`
    };
};

export const SUCCESS_MESSAGE = MESSAGES();
