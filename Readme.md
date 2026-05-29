# Image Processing Service Backend

A TypeScript/Express backend foundation for an image processing service similar to Cloudinary. The project currently includes production-minded API infrastructure, authentication, email/OTP workflows, PostgreSQL persistence, Redis-backed background jobs, OpenAPI documentation, and security middleware. Image transformation work is represented in the queue layer and roadmap, ready to be connected to upload/storage APIs.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Routes](#api-routes)
- [Background Jobs](#background-jobs)
- [Database and Migrations](#database-and-migrations)
- [Testing and Quality](#testing-and-quality)
- [Image Processing Roadmap](#image-processing-roadmap)
- [Contributing](#contributing)
- [Support](#support)
- [Stay in Touch](#stay-in-touch)

## Overview

The service is designed as a backend for authenticated users to upload, process, and retrieve image assets. It already provides the core platform pieces needed for that type of system:

- An Express API written in TypeScript.
- JWT-based authentication and session management.
- Email verification, password reset, and OTP flows.
- PostgreSQL persistence through TypeORM.
- Redis/BullMQ queues for background processing.
- A dedicated worker process for asynchronous jobs.
- Swagger/OpenAPI documentation at runtime.
- Security middleware for headers, CORS, rate limiting, validation, and error handling.

## Features

Current implemented capabilities:

- User sign-up, email verification, login, token refresh, logout, and password reset.
- HTTP-only cookie support for web clients and bearer-token responses for mobile-style clients.
- PostgreSQL entities for users, sessions, OTPs, and audit logs.
- Zod request validation middleware.
- Centralized error handling with custom application errors.
- Swagger UI documentation served from the API.
- Health and security inspection endpoints.
- Redis connection management.
- BullMQ queue service with retries, delayed jobs, recurring jobs, priority jobs, bulk jobs, deduplication, queue stats, pause/resume, drain, and graceful shutdown.
- Worker handlers for email, bulk email, CSV processing, report generation, image resizing, push notifications, webhooks, cleanup, and data sync.

Planned image-service capabilities:

- Image upload and storage.
- Image metadata management.
- Image transformation endpoints.
- Public or signed image delivery URLs.
- Format conversion and compression.
- Transformation history and cache-aware retrieval.

## Tech Stack

- Runtime: Node.js
- Language: TypeScript
- Framework: Express
- Database: PostgreSQL
- ORM: TypeORM
- Queue: BullMQ
- Cache/Queue backend: Redis
- Validation: Zod
- Authentication: JWT, bcrypt
- Email: Nodemailer
- API Docs: Swagger UI / OpenAPI
- Testing: Jest, Supertest
- Security: Helmet, CORS, rate limiting, cookie-parser, XSS utilities

## Project Structure

```text
src/
  app.ts                         Express bootstrap and middleware setup
  auth/                          Authentication service and validations
  config/                        Environment and TypeORM configuration
  controllers/                   Route handlers
  docs/                          OpenAPI/Swagger configuration
  middlewares/                   Auth, validation, docs, and error middleware
  repositories/                  Base entities and repository helpers
  routes/                        API route definitions
  shared/
    constants/                   Shared messages, status codes, and queue constants
    services/                    Email, JWT, OTP, Redis, queue, and worker services
    templates/                   Email templates
    utils/                       Helpers and error utilities
  users/                         User, session, and OTP entities
  audit/                         Audit log entity and validation
```

## Getting Started

### Prerequisites

- Node.js 16 or newer
- npm 8 or newer
- PostgreSQL
- Redis

### Install dependencies

```bash
npm install
```

### Configure environment

Create or update `.env` with the values required for your local setup. At minimum, configure:

```env
PORT=3000
APP_ENV=development
APP_NAME=image-processor

DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/image_processor_db

JWT_SECRET=replace-with-a-strong-secret
JWT_ACCESS_TOKEN_EXPIRY_IN_MINUTES=5
JWT_REFRESH_TOKEN_EXPIRY_IN_DAYS=14

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@yourapp.com

OTP_EXPIRY_TIME_IN_MINUTES=10
OTP_MAX_ATTEMPTS=3
OTP_GENERATION_INTERVAL=1
OTP_ENCRYPTION_KEY=replace-with-a-strong-key
```

`DATABASE_URL` is the simplest way to configure PostgreSQL. If you do not use `DATABASE_URL`, the current TypeORM configuration reads individual database values from `DATABASE`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, and `DATABASE_DATABASE`.

The codebase also includes placeholders for Cloudinary, AWS S3, and Paystack-style configuration. Those are not required for the current core API unless you wire features that use them.

### Start the API in development

```bash
npm run watch
```

The API runs on `http://localhost:3000` by default.

### View API documentation

```text
http://localhost:3000/api-docs
```

### Run the worker process

In a separate terminal:

```bash
npm run worker
```

The worker listens to the queue named by `QUEUE_NAME`, or `default` when `QUEUE_NAME` is not set.

## Environment Variables

Common variables used by the project:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP server port. Defaults to `3000`. |
| `APP_ENV` | Application environment, for example `development` or `production`. |
| `APP_NAME` | Application name used in configuration/templates. |
| `DATABASE_URL` | Full PostgreSQL connection URL. Takes priority when set. |
| `DATABASE` | PostgreSQL host when not using `DATABASE_URL`. |
| `DATABASE_PORT` | PostgreSQL port. |
| `DATABASE_USERNAME` | PostgreSQL username. |
| `DATABASE_PASSWORD` | PostgreSQL password. |
| `DATABASE_DATABASE` | PostgreSQL database name. |
| `JWT_SECRET` | Secret used to sign JWT tokens. |
| `JWT_ACCESS_TOKEN_EXPIRY_IN_MINUTES` | Access token lifetime in minutes. |
| `JWT_REFRESH_TOKEN_EXPIRY_IN_DAYS` | Refresh token lifetime in days. |
| `REDIS_URL` | Redis connection URL. |
| `REDIS_HOST` | Redis host fallback. |
| `REDIS_PORT` | Redis port fallback. |
| `REDIS_PASSWORD` | Redis password, if required. |
| `EMAIL_HOST` | SMTP host. |
| `EMAIL_PORT` | SMTP port. |
| `EMAIL_USERNAME` | SMTP username. |
| `EMAIL_PASSWORD` | SMTP password. |
| `EMAIL_FROM` | Default sender email address. |
| `OTP_EXPIRY_TIME_IN_MINUTES` | OTP validity window. |
| `OTP_MAX_ATTEMPTS` | Maximum OTP verification attempts. |
| `OTP_GENERATION_INTERVAL` | Minimum interval before another OTP can be generated. |
| `OTP_ENCRYPTION_KEY` | Key used by OTP-related encryption helpers. |
| `QUEUE_NAME` | Queue consumed by the worker. Defaults to `default`. |
| `WORKER_CONCURRENCY` | Number of jobs the worker processes concurrently. Defaults to `5`. |

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run build` | Compile TypeScript into `dist/`. |
| `npm start` | Run the compiled API from `dist/app.js`. |
| `npm run watch` | Run the API through `nodemon` and `ts-node`. |
| `npm run worker` | Run `src/shared/services/worker.service.ts` as a worker process. |
| `npm run start:dev` | Compile, then run the development server with `nodemon`. |
| `npm run start:prod` | Compile, then run the production server script. |
| `npm run tsc` | Compile TypeScript. |
| `npm run type-check` | Type-check without emitting files. |
| `npm run lint` | Run ESLint with auto-fix. |
| `npm run format` | Format source files with Prettier. |
| `npm run format:check` | Check formatting. |
| `npm test` | Run Jest tests. |
| `npm run test:watch` | Run Jest in watch mode. |
| `npm run test:cov` | Run Jest with coverage. |
| `npm run migration:create` | Create a TypeORM migration. |
| `npm run migration:generate` | Generate a TypeORM migration from entity changes. |
| `npm run migration:run` | Run pending TypeORM migrations. |
| `npm run migration:revert` | Revert the latest TypeORM migration. |

## API Routes

All versioned routes are mounted under `/api/v1`.

### Root

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Basic welcome/status response. |

### Health

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Service health response with status, timestamp, version, and environment. |

### Auth

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/sign-up` | Create a user account and start email verification. |
| `POST` | `/api/v1/auth/verify-email` | Verify a user email with OTP. |
| `POST` | `/api/v1/auth/resend-otp` | Send another verification OTP. |
| `POST` | `/api/v1/auth/login` | Authenticate and create a session. |
| `POST` | `/api/v1/auth/refresh-token` | Issue a new access token from a refresh token/session. |
| `POST` | `/api/v1/auth/logout` | End a single session. |
| `POST` | `/api/v1/auth/logout-all` | End all sessions for a user. |
| `POST` | `/api/v1/auth/forgot-password` | Send a password reset email when the account exists. |
| `POST` | `/api/v1/auth/reset-password` | Reset a password using the reset payload. |

### Security

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/security/info` | Return security capability and recommendation metadata. |
| `GET` | `/api/v1/security/headers` | Inspect whether expected security headers are present. |

## Background Jobs

The queue layer lives in `src/shared/services/queue.service.ts`, and the worker lives in `src/shared/services/worker.service.ts`.

Supported job types:

| Job Type | Purpose |
| --- | --- |
| `send_email` | Send a single email. |
| `send_bulk_email` | Process a bulk email send. |
| `process_csv` | Process CSV-like data in chunks. |
| `generate_report` | Generate an async report result. |
| `resize_image` | Resize an image payload asynchronously. |
| `push_notification` | Send a notification payload. |
| `webhook` | Deliver a webhook request. |
| `cleanup` | Run maintenance cleanup work. |
| `sync_data` | Sync data between systems. |

Queue features include:

- Per-job retry and backoff defaults.
- Delayed jobs.
- Recurring jobs with cron expressions.
- Caller-provided deduplication IDs.
- Bulk job insertion.
- Priority jobs.
- Queue metrics.
- Failed job retry.
- Queue pause/resume/drain operations.
- Graceful shutdown.

Example worker command:

```bash
QUEUE_NAME=default WORKER_CONCURRENCY=5 npm run worker
```

## Database and Migrations

TypeORM is configured in `src/config/typeorm.config.ts`.

Entities currently include:

- `User`
- `Session`
- `OTP`
- `AuditLog`

Run migrations with:

```bash
npm run migration:run
```

Generate a migration after entity changes:

```bash
npm run migration:generate -- src/database/migrations/YourMigrationName
```

Create an empty migration:

```bash
npm run migration:create -- src/database/migrations/YourMigrationName
```

## Testing and Quality

Run tests:

```bash
npm test
```

Run type-checking:

```bash
npm run type-check
```

Run formatting:

```bash
npm run format
```

Run linting:

```bash
npm run lint
```

## Image Processing Roadmap

The README title describes the long-term product direction. The current repository has the API, auth, persistence, queue, and worker foundation, but image upload and retrieval endpoints still need to be added.

Recommended next milestones:

1. Add an image entity with owner, storage key, mime type, size, dimensions, and metadata.
2. Add upload endpoints using multipart form data.
3. Store originals in a provider such as local storage, S3, or Cloudinary.
4. Add transformation requests that enqueue `resize_image` and other image jobs.
5. Implement real image processing with a library such as Sharp.
6. Persist transformation outputs and expose retrieval URLs.
7. Add signed URLs or access controls for private images.
8. Add tests around uploads, authorization, queue creation, and worker processing.

Potential transformations:

- Resize
- Crop
- Rotate
- Watermark
- Flip or mirror
- Compress
- Convert format, such as JPEG, PNG, WebP
- Apply filters, such as grayscale or sepia

## Contributing

Contributions are currently not open, but issues and feature requests are welcome.

## Support

Give the project a star if you find it useful.

## Stay in Touch

- GitHub: [@salimkarbm](https://github.com/salimkarbm)
- LinkedIn: [Salim Imuzai](https://www.linkedin.com/in/salim-karbm)
- Twitter: [@salimkarbm](https://twitter.com/salimkarbm)
