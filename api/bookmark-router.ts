import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { BookmarkService } from "./services/BookmarkService";

export const bookmarkRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    return BookmarkService.findByUser(ctx.user.id);
  }),

  toggle: authedQuery
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return BookmarkService.toggle(input.questionId, ctx.user.id);
    }),

  status: authedQuery
    .input(z.object({ questionId: z.number() }))
    .query(async ({ ctx, input }) => {
      return BookmarkService.isBookmarked(input.questionId, ctx.user.id);
    }),
});
