import { z } from "zod";
import { ANGELES_CITY_BARANGAYS } from "../utils/constants";

const guestContactSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim();
    return normalized.length ? normalized : undefined;
  },
  z
    .string()
    .refine(
      (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^(?:\+63|0)\d{10}$/;
        return emailRegex.test(value) || phoneRegex.test(value);
      },
      { message: "Guest contact must be a valid email or PH phone number" },
    )
    .optional(),
);

const reportBodySchema = z.object({
  title: z.string().min(3, "Title is too short").max(100, "Title is too long"),
  description: z
    .string()
    .min(10, "Please provide more details")
    .max(1000, "Description exceeds the 1000 character limit"),
  category: z.enum(
    ["Pothole", "Clogged Drain", "Fallen Tree", "Streetlight Out", "Flooding"],
    {
      message: "Invalid category",
    },
  ),
  severity: z.enum(["Low", "Medium", "Critical"], {
    message: "Invalid severity level",
  }),
  barangay: z
    .string()
    .refine((val) => ANGELES_CITY_BARANGAYS.includes(val as any), {
      message: "Please select a valid Angeles City barangay",
    }),
  latitude: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 15.1 && num <= 15.25;
    },
    { message: "Location is outside Angeles City bounds" },
  ),
  longitude: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 120.5 && num <= 120.65;
    },
    { message: "Location is outside Angeles City bounds" },
  ),
});

export const createReportSchema = z.object({
  body: reportBodySchema,
});

export const createGuestReportSchema = z.object({
  body: reportBodySchema.extend({
    guestContact: guestContactSchema,
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["Reported", "Under Review", "In Progress", "Resolved"], {
      message: "Invalid status update",
    }),
  }),
});
