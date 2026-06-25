import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, questions, answers, comments } from "@db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export const adminRouter = createRouter({
  // Dashboard statistics
  stats: adminQuery.query(async () => {
    const db = getDb();

    const [userStats] = await db
      .select({
        total: count(),
        admins: count(sql`CASE WHEN ${users.role} = 'admin' THEN 1 END`),
        moderators: count(sql`CASE WHEN ${users.role} = 'moderator' THEN 1 END`),
        active: count(sql`CASE WHEN ${users.role} = 'user' THEN 1 END`),
      })
      .from(users);

    const [questionStats] = await db
      .select({
        total: count(),
        active: count(sql`CASE WHEN ${questions.status} = 'active' THEN 1 END`),
        closed: count(sql`CASE WHEN ${questions.status} = 'closed' THEN 1 END`),
        totalViews: sql<number>`SUM(${questions.viewCount})`,
        totalVotes: sql<number>`SUM(${questions.voteCount})`,
        totalAnswers: sql<number>`SUM(${questions.answerCount})`,
      })
      .from(questions);

    const [answerStats] = await db
      .select({
        total: count(),
        active: count(sql`CASE WHEN ${answers.status} = 'active' THEN 1 END`),
        accepted: count(sql`CASE WHEN ${answers.isAccepted} = true THEN 1 END`),
      })
      .from(answers);

    const [commentStats] = await db
      .select({ total: count() })
      .from(comments)
      .where(eq(comments.status, "active"));

    return {
      users: userStats,
      questions: questionStats,
      answers: answerStats,
      comments: commentStats,
    };
  }),

  // User management
  users: adminQuery
    .input(
      z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit || 50;
      const offset = input?.offset || 0;

      const results = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      const [totalResult] = await db.select({ count: count() }).from(users);

      return { users: results, total: totalResult.count };
    }),

  updateUserRole: adminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "moderator", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      return db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });
    }),

  // Content moderation
  deleteQuestion: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(questions)
        .set({ status: "deleted" })
        .where(eq(questions.id, input.id));
      return { success: true };
    }),

  deleteAnswer: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(answers)
        .set({ status: "deleted" })
        .where(eq(answers.id, input.id));
      return { success: true };
    }),

  deleteComment: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(comments)
        .set({ status: "deleted" })
        .where(eq(comments.id, input.id));
      return { success: true };
    }),

  // Recent activity
  recentActivity: adminQuery
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit || 20;

      const recentQuestions = await db
        .select()
        .from(questions)
        .orderBy(desc(questions.createdAt))
        .limit(limit);

      const recentAnswers = await db
        .select()
        .from(answers)
        .orderBy(desc(answers.createdAt))
        .limit(limit);

      return { recentQuestions, recentAnswers };
    }),
});
