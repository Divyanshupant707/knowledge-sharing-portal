import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { CategoryService } from "./services/CategoryService";

export const categoryRouter = createRouter({
  list: publicQuery.query(async () => {
    return CategoryService.findAll();
  }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return CategoryService.findBySlug(input.slug);
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return CategoryService.findById(input.id);
    }),

  questions: publicQuery
    .input(
      z.object({
        categoryId: z.number(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return CategoryService.getQuestions(input.categoryId, {
        limit: input.limit,
        offset: input.offset,
      });
    }),

  stats: publicQuery.query(async () => {
    return CategoryService.getStats();
  }),

  // Admin only
  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        slug: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return CategoryService.create(input);
    }),
});
