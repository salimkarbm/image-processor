export const HttpStatus = () => {
    return {
        OK: 200,
        CREATED: 201,
        accepted: 202,
        noContent: 204,
        resetContent: 205,
        partialContent: 206,
        badRequest: 400,
        unauthorized: 401,
        paymentRequired: 402,
        accessForbidden: 403,
        NOT_FOUND: 404,
        methodNotAllowed: 405,
        notAccepted: 406,
        proxyAuthenticationRequired: 407,
        requestTimeout: 408,
        conflict: 409,
        unprocessableEntity: 422,
        internalServerError: 500,
        notImplemented: 501,
        badGateway: 502,
        serviceUnavailableError: 503,
        gatewayTimeout: 504
    };
};

export const STATUS_CODE = HttpStatus();
