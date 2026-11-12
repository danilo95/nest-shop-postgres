import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const envSchema = z.object({
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD es obligatorio'),
  DB_NAME: z
    .string()
    .trim()
    .min(1, 'DB_NAME es obligatorio')
    .regex(/^[a-zA-Z0-9_-]+$/, 'DB_NAME contiene caracteres inválidos'),
  DB_HOST: z.string().trim().min(1, 'DB_HOST es obligatorio'),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_USERNAME: z.string().trim().min(1, 'DB_USERNAME es obligatorio'),
  SYNC: booleanFromEnv,
  PORT: z.coerce.number().int().min(1).max(65535),
  HOST_API: z.string().trim().url(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  PAYPAL_CLIENT_ID: z.string().min(1).optional(),
  PAYPAL_CLIENT_SECRET: z.string().min(1).optional(),
  PAYPAL_BASE_URL: z.string().url().default('https://api-m.sandbox.paypal.com'),
  PAYPAL_CURRENCY: z.string().length(3).default('USD'),
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
