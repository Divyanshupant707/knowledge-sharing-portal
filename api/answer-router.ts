import { z } from "zod";
import { createRouter, publicQuery, authedQuery, moderatorQuery } from "./middleware";
import { AnswerService } from "./services/AnswerService";
import { VoteService } from "./services/VoteService";

export const answerRouter = createRouter({
  list: publicQuery
    .input(z.object({ questionId: z.number() }))
    .query(async ({ input }) => {
      return AnswerService.findByQuestion(input.questionId);
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return AnswerService.findById(input.id);
    }),

  create: authedQuery
    .input(
      z.object({
        content: z.string().min(10, "Answer must be at least 10 characters"),
        questionId: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return AnswerService.create({
        ...input,
        authorId: ctx.user.id,
      });
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        content: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return AnswerService.update(input.id, ctx.user.id, {
        content: input.content,
      });
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return AnswerService.delete(input.id, ctx.user.id, ctx.user.role === "admin");
    }),

  accept: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return AnswerService.accept(input.id, ctx.user.id, ctx.user.role === "admin");
    }),

  vote: authedQuery
    .input(
      z.object({
        answerId: z.number(),
        value: z.number().min(-1).max(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return VoteService.vote("answer", input.answerId, ctx.user.id, input.value);
    }),

  // Moderator: can delete any answer
  moderatorDelete: moderatorQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = require("./queries/connection");
      const { answers } = require("@db/schema");
      const { eq } = require("drizzle-orm");
      const db = getDb();
      await db
        .update(answers)
        .set({ status: "deleted" })
        .where(eq(answers.id, input.id));
      return { success: true };
    }),
});
