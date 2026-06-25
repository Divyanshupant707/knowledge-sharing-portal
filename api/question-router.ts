import { z } from "zod";
import { createRouter, publicQuery, authedQuery, moderatorQuery } from "./middleware";
import { QuestionService } from "./services/QuestionService";
import { VoteService } from "./services/VoteService";
import { BookmarkService } from "./services/BookmarkService";

export const questionRouter = createRouter({
  // Public queries
  list: publicQuery
    .input(
      z.object({
        categoryId: z.number().optional(),
        tagId: z.number().optional(),
        authorId: z.number().optional(),
        sortBy: z.enum(["newest", "popular", "unanswered", "votes"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return QuestionService.findAll(input || {});
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      return QuestionService.findById(input.id, userId);
    }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      return QuestionService.findBySlug(input.slug, userId);
    }),

  // Authenticated mutations
  create: authedQuery
    .input(
      z.object({
        title: z.string().min(5, "Title must be at least 5 characters").max(300),
        content: z.string().min(10, "Content must be at least 10 characters"),
        categoryId: z.number().positive(),
        tagNames: z.array(z.string()).max(5, "Maximum 5 tags").default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return QuestionService.create({
        ...input,
        authorId: ctx.user.id,
      });
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(5).max(300).optional(),
        content: z.string().min(10).optional(),
        categoryId: z.number().positive().optional(),
        tagNames: z.array(z.string()).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      return QuestionService.update(id, ctx.user.id, updates);
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return QuestionService.delete(input.id, ctx.user.id, ctx.user.role === "admin");
    }),

  // View tracking
  recordView: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      return QuestionService.recordView(input.id, userId);
    }),

  // Vote
  vote: authedQuery
    .input(
      z.object({
        questionId: z.number(),
        value: z.number().min(-1).max(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return VoteService.vote("question", input.questionId, ctx.user.id, input.value);
    }),

  // Bookmark
  toggleBookmark: authedQuery
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return BookmarkService.toggle(input.questionId, ctx.user.id);
    }),

  // Moderator actions
  close: moderatorQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = require("./queries/connection");
      const { questions } = require("@db/schema");
      const { eq } = require("drizzle-orm");
      const db = getDb();
      await db
        .update(questions)
        .set({ isClosed: true, status: "closed" })
        .where(eq(questions.id, input.id));
      return { success: true };
    }),

  reopen: moderatorQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = require("./queries/connection");
      const { questions } = require("@db/schema");
      const { eq } = require("drizzle-orm");
      const db = getDb();
      await db
        .update(questions)
        .set({ isClosed: false, status: "active" })
        .where(eq(questions.id, input.id));
      return { success: true };
    }),
});
