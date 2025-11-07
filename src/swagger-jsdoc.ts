import swaggerJsdoc from 'swagger-jsdoc';
// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Image Processor API',
            version: '1.0.0',
            description:
                'A comprehensive API for managing Images with authentication and authorization',
            contact: {
                name: 'Salim Imuzai',
                email: 'salimimuzai@gmail.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Development server'
            },
            {
                url: 'https://api.imageprocessor.com/v1',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['id', 'email', 'firstName', 'lastName'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Unique user identifier',
                            example: '64a7b8c9d1e2f3g4h5i6j7k8'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                            example: 'john.doe@example.com'
                        },
                        firstName: {
                            type: 'string',
                            description: 'User first name',
                            example: 'John'
                        },
                        lastName: {
                            type: 'string',
                            description: 'User last name',
                            example: 'Doe'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'user', 'moderator'],
                            description: 'User role',
                            example: 'user'
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'User account status',
                            example: true
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2023-08-15T10:30:00Z'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2023-08-15T14:20:00Z'
                        }
                    }
                },
                CreateUserRequest: {
                    type: 'object',
                    required: ['email', 'password', 'firstName', 'lastName'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john.doe@example.com'
                        },
                        username: {
                            type: 'string',
                            minLength: 3,
                            maxLength: 50,
                            pattern: '^[a-zA-Z0-9_]+$',
                            example: 'johndoe123'
                        },
                        password: {
                            type: 'string',
                            minLength: 8,
                            example: 'SecurePassword123!'
                        },
                        firstName: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 100,
                            example: 'John'
                        },
                        lastName: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 100,
                            example: 'Doe'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'user', 'moderator'],
                            default: 'user',
                            example: 'user'
                        }
                    }
                },
                UpdateUserRequest: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john.updated@example.com'
                        },
                        username: {
                            type: 'string',
                            minLength: 3,
                            maxLength: 50,
                            pattern: '^[a-zA-Z0-9_]+$',
                            example: 'johndoe_updated'
                        },
                        firstName: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 100,
                            example: 'John'
                        },
                        lastName: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 100,
                            example: 'Smith'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'user', 'moderator'],
                            example: 'moderator'
                        },
                        isActive: {
                            type: 'boolean',
                            example: false
                        }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                oneOf: [
                                    { $ref: '#/components/schemas/User' },
                                    { $ref: '#/components/schemas/Product' }
                                ]
                            }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer', example: 1 },
                                limit: { type: 'integer', example: 10 },
                                totalPages: { type: 'integer', example: 5 },
                                totalItems: { type: 'integer', example: 50 },
                                hasNext: { type: 'boolean', example: true },
                                hasPrev: { type: 'boolean', example: false }
                            }
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'object',
                            properties: {
                                code: {
                                    type: 'string',
                                    example: 'VALIDATION_ERROR'
                                },
                                message: {
                                    type: 'string',
                                    example: 'The provided data is invalid'
                                },
                                details: {
                                    type: 'object',
                                    additionalProperties: true
                                },
                                timestamp: {
                                    type: 'string',
                                    format: 'date-time',
                                    example: '2023-08-15T10:30:00Z'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                NotFound: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                ValidationError: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                Unauthorized: {
                    description: 'Unauthorized access',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                ServerError: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/*.ts', './src/doc/open-api-spec.yaml'] // Path to files containing OpenAPI definitions
};

export default swaggerJsdoc(swaggerOptions);
