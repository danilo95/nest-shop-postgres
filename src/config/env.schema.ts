import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const envSchema = z
  .object({
    STAGE: z.string().min(1, 'STAGE es obligatorio'),
    DATABASE_URL: z.string().url().optional(),
    DB_PASSWORD: z.string().min(1).optional(),
    DB_NAME: z
      .string()
      .trim()
      .min(1)
      .regex(/^[a-zA-Z0-9_-]+$/, 'DB_NAME contiene caracteres inválidos')
      .optional(),
    DB_HOST: z.string().trim().min(1).optional(),
    DB_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    DB_USERNAME: z.string().trim().min(1).optional(),
    SYNC: booleanFromEnv,
    PORT: z.coerce.number().int().min(1).max(65535).optional(),
    HOST_API: z.string().trim().url(),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
    PAYPAL_CLIENT_ID: z.string().min(1).optional(),
    PAYPAL_CLIENT_SECRET: z.string().min(1).optional(),
    PAYPAL_BASE_URL: z.string().url().default('https://api-m.sandbox.paypal.com'),
    PAYPAL_CURRENCY: z.string().length(3).default('USD'),
  })
  .superRefine((config, context) => {
    if (config.DATABASE_URL) return;

    for (const key of [
      'DB_PASSWORD',
      'DB_NAME',
      'DB_HOST',
      'DB_PORT',
      'DB_USERNAME',
    ] as const) {
      if (config[key] === undefined) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} es obligatorio cuando DATABASE_URL no está definido`,
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Configuración de entorno inválida:\n${details}`);
  }

  return result.data;
}
