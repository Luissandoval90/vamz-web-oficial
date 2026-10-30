import { z } from "zod";

export const minecraftVersionSchema = z.object({
  version: z.string().trim().min(1, "Indica el número de versión.").max(40).regex(/^[0-9][a-zA-Z0-9. _-]*$/, "Usa un número de versión válido, por ejemplo 1.21.100."),
  edition: z.enum(["Bedrock", "Java"]),
  platform: z.enum(["Android", "Windows", "macOS", "Linux", "Multiplataforma"]),
});

export type MinecraftVersionMetadata = z.infer<typeof minecraftVersionSchema>;
