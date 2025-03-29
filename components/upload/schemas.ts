// schemas.ts

import { z } from "zod";

// Define tu esquema
export const DocumentoSchema = z.object({
  columna1: z.string(),
  columna2: z.string(),
  // Agrega más campos según sea necesario
});
