import { OpenAPIV3 } from 'openapi-types';
import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Image Processor API',
      version: '1.0.0',
      description:
        'A comprehensive API for a image processing system with image manipulation, enhancement, and more.',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.imageprocessor.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: [
            'id',
            'email',
            'firstName',
            'lastName',
            'username',
            ' password',
          ],
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier',
              example: '64a7b8c9d1e2f3g4h5i6j7k8',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'John',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              example: 'Doe',
            },
            biography: {
              type: 'string',
              description: 'Short biography of the user',
              example: 'Avid reader and book lover.',
            },
            nationality: {
              type: 'string',
              description: 'Nationality of the user',
              example: 'Kenyan',
            },
            birthDate: {
              type: 'string',
              format: 'date',
              description: 'User birth date',
              example: '1990-05-20',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'moderator'],
              description: 'User role',
              example: 'user',
            },
            isActive: {
              type: 'boolean',
              description: 'User account status',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-08-15T10:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-08-15T14:20:00Z',
            },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'username'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
              pattern: '^[a-zA-Z0-9_]+$',
              example: 'johndoe',
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'SecurePassword123!',
            },
            firstName: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'John',
            },
            lastName: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Doe',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'moderator'],
              default: 'user',
              example: 'user',
            },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john.updated@example.com',
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
              pattern: '^[a-zA-Z0-9_]+$',
              example: 'johndoe_updated',
            },
            firstName: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'John',
            },
            lastName: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Smith',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'moderator'],
              example: 'moderator',
            },
            isActive: {
              type: 'boolean',
              example: false,
            },
          },
        },
        // Product: {
        //   type: 'object',
        //   required: [
        //     'id',
        //     'name',
        //     'price',
        //     'description',
        //     'createdAt',
        //     'updatedAt',
        //   ],
        //   properties: {
        //     id: {
        //       type: 'string',
        //       description: 'Unique product identifier',
        //       example: '64a7b8c9d1e2f3g4h5i6j7k9',
        //     },
        //     name: {
        //       type: 'string',
        //       description: 'Product name',
        //       example: 'Premium Headphones',
        //     },
        //     description: {
        //       type: 'string',
        //       description: 'Product description',
        //       example: 'High-quality headphones with noise cancellation',
        //     },
        //     price: {
        //       type: 'number',
        //       format: 'float',
        //       minimum: 0,
        //       description: 'Product price in USD',
        //       example: 299.99,
        //     },
        //     createdAt: {
        //       type: 'string',
        //       format: 'date-time',
        //       example: '2023-08-15T10:30:00Z',
        //     },
        //     updatedAt: {
        //       type: 'string',
        //       format: 'date-time',
        //       example: '2023-08-15T14:20:00Z',
        //     },
        //   },
        // },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 5 },
            totalItems: { type: 'integer', example: 50 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
          },
        },
        // PaginatedResponse: {
        //   type: 'object',
        //   properties: {
        //     data: {
        //       type: 'array',
        //       items: {
        //         oneOf: [
        //           { $ref: '#/components/schemas/User' },
        //           { $ref: '#/components/schemas/Product' },
        //         ],
        //       },
        //     },
        //     pagination: {
        //       type: 'object',
        //       properties: {
        //         page: { type: 'integer', example: 1 },
        //         limit: { type: 'integer', example: 10 },
        //         totalPages: { type: 'integer', example: 5 },
        //         totalItems: { type: 'integer', example: 50 },
        //         hasNext: { type: 'boolean', example: true },
        //         hasPrev: { type: 'boolean', example: false },
        //       },
        //     },
        //   },
        // },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'The provided data is invalid',
                },
                details: {
                  type: 'object',
                  additionalProperties: true,
                  example: {
                    email: 'Email is required',
                    password: 'Password must be at least 8 characters',
                  },
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  example: '2023-08-15T10:30:00Z',
                },
              },
            },
          },
        },
        SecurityOverviewResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            message: {
              type: 'string',
              example: 'API security overview retrieved successfully',
            },
            data: {
              type: 'object',
              properties: {
                authentication: {
                  type: 'string',
                  example: 'JWT (JSON Web Tokens)',
                },
                authorization: {
                  type: 'string',
                  example: 'Role-based access control',
                },
                inputValidation: {
                  type: 'string',
                  example: 'Implemented to prevent SQL injection and XSS',
                },
                rateLimiting: {
                  type: 'string',
                  example:
                    'Implemented on authentication endpoints to prevent brute-force attacks',
                },
                https: {
                  type: 'string',
                  example: 'All communication should be done over HTTPS',
                },
                bestPractices: {
                  type: 'string',
                  example:
                    'Use strong passwords, keep software up to date, and monitor for suspicious activity',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  example: '2023-08-15T10:30:00Z',
                },
                environment: {
                  type: 'string',
                  example: 'production',
                },
                version: {
                  type: 'string',
                  example: '1.0.0',
                },
                service: {
                  type: 'string',
                  example: 'Image Processor API',
                },
              },
            },
          },
        },
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  message: 'The requested resource was not found',
                  code: 'NOT_FOUND',
                  details: {
                    resource: 'User',
                    id: '64a7b8c9d1e2f3g4h5i6j7k8',
                  },
                  timestamp: '2023-08-15T10:30:00Z',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  message: 'Input data validation failed',
                  code: 'VALIDATION_ERROR',
                  details: {
                    email: 'Email is invalid',
                    password: 'Password must contain at least one number',
                  },
                  timestamp: '2023-08-15T10:30:00Z',
                },
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized access',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  message: 'Invalid or missing authentication token',
                  code: 'UNAUTHORIZED',
                  details: {
                    token: 'Token is expired or invalid',
                  },
                  timestamp: '2023-08-15T10:30:00Z',
                },
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  message: 'An unexpected error occurred',
                  code: 'INTERNAL_SERVER_ERROR',
                  details: {
                    info: 'Null reference exception in UserService',
                  },
                  timestamp: '2023-08-15T10:30:00Z',
                },
              },
            },
          },
        },
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  message:
                    'The request could not be understood or was missing required parameters',
                  code: 'BAD_REQUEST',
                  details: {
                    parameter: 'Missing required field "email"',
                  },
                  timestamp: '2023-08-15T10:30:00Z',
                },
              },
            },
          },
        },
        Conflict: {
          description: 'Conflict',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  message:
                    'The request could not be completed due to a conflict with the current state of the resource',
                  code: 'CONFLICT',
                  details: {
                    email: 'Email address already in use',
                  },
                  timestamp: '2023-08-15T10:30:00Z',
                },
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden access',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  message: 'You do not have permission to access this resource',
                  code: 'FORBIDDEN',
                  details: {
                    role: 'User role "user" cannot access admin resources',
                  },
                  timestamp: '2023-08-15T10:30:00Z',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ['./src/routes/**/*.ts', './src/docs/v1/**/*.ts'], // Path to files containing OpenAPI definitions
};
export const specConfig = swaggerJsdoc(swaggerOptions) as OpenAPIV3.Document;
