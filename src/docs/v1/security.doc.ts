/**
 * @fileoverview Security documentation for the Image Processor API
 * @version 1.0.0
 * @author Salim
 * @description This document provides an overview of the security measures implemented in the Image Processor API, including authentication, authorization, and best practices for secure API usage.
 * @security This API uses JWT (JSON Web Tokens) for authentication and role-based access control for authorization. All endpoints require a valid JWT token, and certain endpoints are restricted based on user roles (e.g., admin, user).
 * @securityDefinitions The API implements the following security measures:
 * - Authentication: Users must authenticate using their credentials to receive a JWT token, which must be included in the Authorization header of subsequent requests.
 * - Authorization: Access to certain endpoints is restricted based on user roles. For example, only users with the 'admin' role can access administrative endpoints.
 * - Input Validation: All incoming data is validated to prevent common security vulnerabilities such as SQL injection and cross-site scripting (XSS).
 * - Rate Limiting: To protect against brute-force attacks, the API implements rate limiting on authentication endpoints.
 * - HTTPS: All communication with the API should be done over HTTPS to ensure data confidentiality and integrity.
 * @bestPractices To ensure secure usage of the API, clients should follow these best practices:
 * - Always use HTTPS when communicating with the API to protect sensitive data.
 * - Store JWT tokens securely on the client side and never expose them in client-side code or logs.
 * - Implement proper error handling to avoid exposing sensitive information in error messages.
 * - Regularly update and patch any dependencies used in the application to mitigate known vulnerabilities.
 * - Use strong, unique passwords for user accounts and encourage users to do the same.
 * - Monitor API usage and implement logging to detect and respond to potential security incidents.
 */

/**
 * @openapi
 * /v1/health:
 *  get:
 *    summary: Health check endpoint
 *    description: Returns the health status of the API, confirming that the service is up and running.
 *    tags:
 *      - Health
 *    responses:
 *      200:
 *        description: API is healthy and operational.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: "ok"
 *                message:
 *                  type: string
 *                  example: "API is healthy, service is up and running"
 *                timestamp:
 *                  type: string
 *                  format: date-time
 *                  example: "2024-06-01T12:00:00Z"
 *                service:
 *                  type: string
 *                  example: "Image Processor API"
 *                version:
 *                  type: string
 *                  example: "1.0.0"
 *                environment:
 *                  type: string
 *                  example: "production"
 */

/**
 * @openapi
 * /v1/security/info:
 *   get:
 *     summary: Security information of the Image Processor API
 *     description: Provides an overview of the security measures implemented in the API, including authentication, authorization, and best practices for secure API usage.
 *     tags:
 *       - Security
 *     responses:
 *       200:
 *         description: A detailed overview of the API's security measures and best practices.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "API security overview retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     authentication:
 *                       type: string
 *                       example: "JWT (JSON Web Tokens)"
 *                     authorization:
 *                       type: string
 *                       example: "Role-based access control"
 *                     inputValidation:
 *                       type: string
 *                       example: "Implemented to prevent SQL injection and XSS"
 *                     rateLimiting:
 *                       type: string
 *                       example: "Implemented on authentication endpoints to prevent brute-force attacks"
 *                     https:
 *                       type: string
 *                       example: "All communication should be done over HTTPS"
 *                     bestPractices:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: [
 *                         "Always use HTTPS when communicating with the API",
 *                         "Store JWT tokens securely on the client side",
 *                         "Implement proper error handling",
 *                         "Regularly update and patch dependencies",
 *                         "Use strong, unique passwords for user accounts",
 *                         "Monitor API usage and implement logging"
 *                       ]
 *       400:
 *          $ref: '#/components/responses/BadRequest'
 *       401:
 *          $ref: '#/components/responses/Unauthorized'
 *       403:
 *          $ref: '#/components/responses/Forbidden'
 *       500:
 *          $ref: '#/components/responses/ServerError'
 */

/**
 * @openapi
 * /v1/security/overview:
 *   get:
 *     summary: Security overview of the Image Processor API
 *     description: Provides an overview of the security measures implemented in the API, including authentication, authorization, and best practices for secure API usage.
 *     tags:
 *       - Security
 *     responses:
 *       200:
 *         description: A detailed overview of the API's security measures and best practices.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SecurityOverviewResponse'
 *       400:
 *          $ref: '#/components/responses/BadRequest'
 *       401:
 *          $ref: '#/components/responses/Unauthorized'
 *       403:
 *          $ref: '#/components/responses/Forbidden'
 *       500:
 *          $ref: '#/components/responses/ServerError'
 */

/**
 * @openapi
 * /v1/security/headers:
 *  get:
 *    summary: Get security headers
 *    description: Returns security headers implemented in the API to enhance security and protect against common vulnerabilities.
 *    tags:
 *      - Security
 *    responses:
 *      200:
 *        description: A list of security headers implemented in the API.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: "ok"
 *                message:
 *                  type: string
 *                  example: "Security headers retrieved successfully"
 *                data:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      header:
 *                        type: string
 *                        example: "Content-Security-Policy"
 *                      value:
 *                        type: string
 *                        example: "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self';"
 */
