import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
});

export const registerSchema = credentialsSchema.extend({
  username: z
    .string()
    .trim()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres.")
    .max(32, "El nombre de usuario debe tener 32 caracteres o menos.")
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .refine(
      (value) => /^[\p{L}\p{N}._ -]+$/u.test(value),
      "Usa solo letras, numeros, espacios, puntos, guiones o guion bajo.",
    ),
});

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "El nombre de usuario debe tener al menos 3 caracteres.")
  .max(32, "El nombre de usuario debe tener 32 caracteres o menos.")
  .transform((value) => value.replace(/\s+/g, " ").trim())
  .refine(
    (value) => /^[\p{L}\p{N}._ -]+$/u.test(value),
    "Usa solo letras, numeros, espacios, puntos, guiones o guion bajo.",
  );

export const profileSchema = z.object({
  username: usernameSchema,
});

export const resourceTitleSchema = z
  .string()
  .trim()
  .max(120, "El nombre del recurso debe tener 120 caracteres o menos.")
  .transform((value) => value.replace(/\s+/g, " ").trim());

export const resourceDescriptionSchema = z
  .string()
  .trim()
  .max(600, "La descripcion debe tener 600 caracteres o menos.")
  .transform((value) => value.replace(/\s+/g, " ").trim());

export const resourceMetadataSchema = z.object({
  title: resourceTitleSchema.optional().default(""),
  description: resourceDescriptionSchema.optional().default(""),
});

export const socialLinkSchema = z.object({
  platform: z
    .string()
    .trim()
    .min(2, "El nombre de la red debe tener al menos 2 caracteres.")
    .max(40, "El nombre de la red debe tener 40 caracteres o menos.")
    .transform((value) => value.replace(/\s+/g, " ").trim()),
  url: z.string().trim().url("Ingresa un enlace valido."),
  icon: z
    .string()
    .trim()
    .max(8, "El icono debe tener 8 caracteres o menos.")
    .optional()
    .default(""),
});
