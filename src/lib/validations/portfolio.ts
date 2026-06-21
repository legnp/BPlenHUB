import { z } from "zod";

export const ProductSheetSchema = z.object({
  description: z.string().min(1),
  coverImage: z.string().min(1),
  paymentConditions: z.string().min(1),
  faq: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
    })
  ),
  termsAndConditions: z.string().min(1),
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    keywords: z.array(z.string()),
  }),
  deliverables: z.array(z.string()).optional(),
});

export const CapabilityConfigSchema = z.object({
  surveys: z.array(z.string()),
  forms: z.array(z.string()),
  allowedEventTypes: z.array(z.string()),
});

export const WorkflowStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["milestone", "task"]),
  description: z.string(),
  requiredSubStepId: z.string().optional(),
});

export const DeliveryStepSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["survey", "form", "meeting", "content", "upload", "feedback"]),
  referenceId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});

export const ProductSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  serviceCode: z.string().min(1),
  title: z.string().min(1),
  kicker: z.string().optional(),
  targetAudiences: z.array(z.enum(["people", "companies", "partners", "internal"])),
  price: z.number().nonnegative(),
  pricePix: z.number().nonnegative(),
  maxInstallments: z.number().int().min(1).max(12),
  isStepJourney: z.boolean(),
  order: z.number().optional(),
  sheet: ProductSheetSchema,
  capabilities: CapabilityConfigSchema,
  workflow: z.array(WorkflowStepSchema),
  deliverySteps: z.array(DeliveryStepSchema).optional(),
  grantedQuotas: z.record(z.string(), z.number()),
  status: z.enum(["draft", "active", "archived"]),
  driveConfig: z.object({
    folderId: z.string(),
    sheetId: z.string(),
    sheetUrl: z.string(),
  }).optional(),
});

export const PortfolioPayloadSchema = z.array(ProductSchema);
