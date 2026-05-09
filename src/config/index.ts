import 'dotenv/config';

export const configuration = () => {
  return {
    APP: {
      port: parseInt(process.env.PORT as string, 10) || 3000,
      env: process.env.APP_ENV || 'development',
      name: process.env.APP_NAME,
      version: process.env.APP_VERSION,
    },
    DATABASE: {
      URI:
        process.env.DATABASE_URI ||
        'postgres://postgres:yourpassword@localhost:5432/image_processor_db',
      URL: process.env.DATABASE_URL,
      DRIVER: process.env.DATABASE_DRIVER as 'postgres',
      HOST: process.env.DATABASE,
      PORT: Number(process.env.DATABASE_PORT),
      USERNAME: process.env.DATABASE_USERNAME,
      PASSWORD: process.env.DATABASE_PASSWORD,
      NAME: process.env.DATABASE_DATABASE,
      SSL: process.env.DATABASE_SSL,
    },
    JWT: {
      secret: process.env.JWT_SECRET,
      accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '1d',
      refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '14d',
      expiresIn: process.env.JWT_EXPIRY || '30s',
    },
  };
};

export const ENV_CONFIG = configuration();
