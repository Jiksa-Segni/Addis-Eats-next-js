import { z } from "zod";

export const orderSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  phone: z.string().trim().regex(/^(09|\+2519)\d{8,9}$/, "Use a valid Ethiopian phone number such as 09... or +2519..."),
  address: z.string().trim().min(5, "Address must be at least 5 characters."),
  notes: z.string().trim().max(200, "Notes must be under 200 characters.").optional().default(""),
});
