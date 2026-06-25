import { z } from "zod";
import { createRouter, publicQuery, authedQuery, moderatorQuery } from "./middleware";
import { CommentService } from "./services/CommentService";

export const commentRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        parentType: z.enum(["question", "answer"]),
        parentId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return CommentService.findByParent(input.parentType, input.parentId);
    }),

  create: authedQuery
    .input(
      z.object({
        content: z.string().min(2, "Comment too short").max(1000, "Comment too long"),
        parentType: z.enum(["question", "answer"]),
        parentId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CommentService.create({
        ...input,
        authorId: ctx.user.id,
      });
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        content: z.string().min(2).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CommentService.update(input.id, ctx.user.id, input.content);
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return CommentService.delete(input.id, ctx.user.id, ctx.user.role === "admin");
    }),

  // Moderator can delete any comment
  moderatorDelete: moderatorQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = require("./queries/connection");
      const { comments } = require("@db/schema");
      const { eq } = require("drizzle-orm");
      const db = getDb();
      await db
        .update(comments)
        .set({ status: "deleted" })
        .where(eq(comments.id, input.id));
      return { success: true };
    }),
});
