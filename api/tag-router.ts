import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { TagService } from "./services/TagService";

export const tagRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return TagService.findAll(input || {});
    }),

  popular: publicQuery
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return TagService.findPopular(input?.limit || 20);
    }),

  byName: publicQuery
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      return TagService.findByName(input.name);
    }),

  questions: publicQuery
    .input(
      z.object({
        tagId: z.number(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return TagService.getQuestions(input.tagId, {
        limit: input.limit,
        offset: input.offset,
      });
    }),

  stats: publicQuery.query(async () => {
    return TagService.getStats();
  }),
});
