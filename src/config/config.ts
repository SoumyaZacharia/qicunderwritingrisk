// src/config/configuration.ts

/**
 * Defines the application's configuration structure.
 * Environment variables are accessed via process.env.
 * Default values are provided where appropriate.
 */
const appConfiguration = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'testing',
  bigQueryServiceAccount: process.env.BIG_QUERY_KEY_FILE_NAME,
});

/**
 * Defines the TypeScript type for the configuration object returned by the default export.
 * This provides type safety when injecting and using ConfigService.
 * Example usage: `private configService: ConfigService<ConfigType>`
 */
export default appConfiguration;

/**
 * Defines the TypeScript type for the configuration object returned by the default export.
 * This provides type safety when injecting and using ConfigService.
 * Example usage: `private configService: ConfigService<ConfigType>`
 */
export type ConfigType = ReturnType<typeof appConfiguration>;
