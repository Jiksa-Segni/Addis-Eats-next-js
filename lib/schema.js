import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(09\d{8,9}|\+2519\d{8,9})$/, "Use a valid Ethiopian phone number such as 09... or +2519...");

export const orderSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  phone: phoneSchema,
  address: z.string().trim().min(5, "Address must be at least 5 characters."),
  notes: z.string().trim().max(200, "Notes must be under 200 characters.").optional().default(""),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().min(1, "Quantity must be at least 1.").max(20, "Maximum 20 of any single item per order."),
      })
    )
    .min(1, "Add at least one item to your cart.")
    .max(50, "An order cannot exceed 50 line items."),
});

export const dishSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  price: z.number().finite().positive("Price must be greater than zero.").max(100000),
  description: z.string().trim().min(5, "Description must be at least 5 characters.").max(500),
  image: z
    .string()
    .trim()
    .max(500)
    .refine((value) => !value || /^\/images\/[\w.% -]+$/i.test(value), "Use an image path from /images/.")
    .optional()
    .default("/images/dorowet.jpg"),
});
