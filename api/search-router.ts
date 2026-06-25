import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { SearchService } from "./services/SearchService";

export const searchRouter = createRouter({
  search: publicQuery
    .input(
      z.object({
        query: z.string().min(1, "Search query is required"),
        type: z.enum(["question", "answer", "user", "tag", "category"]).optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().min(1).max(50).optional(),
        offset: z.number().min(0).optional(),
      })
    )
    .query(async ({ input }) => {
      return SearchService.search(input.query, {
        type: input.type,
        tags: input.tags,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  quick: publicQuery
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return SearchService.quickSearch(input.query, input.limit || 5);
    }),

  suggestions: publicQuery
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      return SearchService.getSuggestions(input.query);
    }),
});
