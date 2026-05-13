/**
 * @openapi
 * /v1/auth/sign-up:
 *   post:
 *     summary: Sign up for the Image Processor API
 *     description: Registers a new user and sends OTP for verification.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 example: "secure_password"
 *               firstName:  # Fixed: was over-indented
 *                 type: string
 *                 example: "John"
 *               lastName:   # Fixed: was over-indented
 *                 type: string
 *                 example: "Doe"
 *     responses:
 *       200:
 *         description: Successful sign-up, sends OTP for verification.
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
 *                   example: "Sign-up successful"
 *                 data:      # Fixed: everything below was over-indented
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a7b8c9d1e2f3g4h5i6j7k8"
 *                     email:  # Fixed: was 1 space too far
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     firstName:  # Fixed: was 1 space too far
 *                       type: string
 *                       example: "John"
 *                     lastName:   # Fixed: was 1 space too far
 *                       type: string
 *                       example: "Doe"
 *                     username:   # Fixed: was 1 space too far
 *                       type: string
 *                       example: "johndoe"
 *                     role:       # Fixed: was 1 space too far
 *                       type: string
 *                       example: "user"
 *                     status:     # Fixed: was 1 space too far
 *                       type: string
 *                       example: "pending"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @openapi
 * /v1/auth/verify-email:
 *   post:
 *     summary: Verify email with OTP
 *     description: Verifies a user's email address using a one-time password (OTP) sent to their email.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Invalid OTP or email.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @openapi
 * /v1/auth/login:
 *   post:
 *     summary: Login to the Image Processor API
 *     description: Authenticates a user and returns a JWT token for subsequent requests.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 example: "secure_password"
 *     responses:
 *       200:
 *         description: Successful login, returns a JWT token.
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
 */
