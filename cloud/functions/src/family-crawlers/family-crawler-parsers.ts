import {z} from "zod";

export const FIREBASE_FAMILY_CRAWLER_PARSER = z.object({
  eventFamily: z.string(),
  kind: z.literal("devoxxians"),
  url: z.string(),
  spaceToken: z.string().optional(),
})
