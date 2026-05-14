import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  accounts: defineTable({
    id: v.string(),
    role: v.string(), // "admin" or "district"
    district: v.string(),
    officerName: v.string(),
    username: v.string(),
    password: v.string(),
    address: v.string(),
    createdAt: v.string()
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
      ph: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      })),
      ec: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      })),
      organicCarbon: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      })),
      nitrogen: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      })),
      phosphorous: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      })),
      potassium: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      })),
      sulphur: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      })),
      zinc: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      })),
      boron: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      })),
      iron: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      })),
      manganese: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      })),
      copper: v.optional(v.object({
        value: v.any(),
        status: v.string(),
        text: v.string(),
        rangeText: v.string()
      }))
    }),
    recommendation: v.string(),
    createdBy: v.string(),
    createdAt: v.string()
  })
    .index("by_district", ["district"])
});
