import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Helper for parameter evaluation object
const paramEvaluationV = v.object({
  value: v.union(v.string(), v.number()),
  status: v.string(),
  text: v.string(),
  rangeText: v.string()
});

export default defineSchema({
  accounts: defineTable({
    id: v.string(),
    role: v.string(), // "admin" or "district"
    district: v.string(),
    officerName: v.string(),
    username: v.string(),
    password: v.string(),
    address: v.string(),
    createdAt: v.string(),
    conditionNote: v.optional(v.string())
  })
    .index("by_username", ["username"]),

  soil_cards: defineTable({
    id: v.string(),
    district: v.string(),
    testCenterAddress: v.string(),
    testCenterId: v.string(),
    testingDate: v.string(),
    surveyNo: v.string(),
    farmerName: v.string(),
    farmerVillage: v.string(),
    soilTexture: v.string(),
    moistureContext: v.string(),
    parameters: v.object({
      ph: v.string(),
      ec: v.string(),
      organicCarbon: v.string(),
      nitrogen: v.string(),
      phosphorous: v.string(),
      potassium: v.string(),
      sulphur: v.string(),
      zinc: v.string(),
      boron: v.string(),
      iron: v.string(),
      manganese: v.string(),
      copper: v.string()
    }),
    evaluations: v.object({
      ph: v.optional(paramEvaluationV),
      ec: v.optional(paramEvaluationV),
      organicCarbon: v.optional(paramEvaluationV),
      nitrogen: v.optional(paramEvaluationV),
      phosphorous: v.optional(paramEvaluationV),
      potassium: v.optional(paramEvaluationV),
      sulphur: v.optional(paramEvaluationV),
      zinc: v.optional(paramEvaluationV),
      boron: v.optional(paramEvaluationV),
      iron: v.optional(paramEvaluationV),
      manganese: v.optional(paramEvaluationV),
      copper: v.optional(paramEvaluationV)
    }),
    recommendation: v.string(),
    createdBy: v.string(),
    createdAt: v.string()
  })
    .index("by_district", ["district"])
});
