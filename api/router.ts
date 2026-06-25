import { authRouter } from "./auth-router";
import { questionRouter } from "./question-router";
import { answerRouter } from "./answer-router";
import { commentRouter } from "./comment-router";
import { categoryRouter } from "./category-router";
import { tagRouter } from "./tag-router";
import { bookmarkRouter } from "./bookmark-router";
import { searchRouter } from "./search-router";
import { adminRouter } from "./admin-router";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { questions, answers, users, tags } from "@db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  // Auth
  auth: authRouter,

  // Core features
  question: questionRouter,
  answer: answerRouter,
  comment: commentRouter,
  category: categoryRouter,
  tag: tagRouter,
  bookmark: bookmarkRouter,
  search: searchRouter,
  admin: adminRouter,

  // Dashboard summary (public)
  dashboard: publicQuery.query(async () => {
    const db = getDb();

    const [questionStats] = await db
      .select({
        total: count(),
        totalViews: sql<number>`SUM(${questions.viewCount})`,
        totalAnswers: sql<number>`SUM(${questions.answerCount})`,
      })
      .from(questions)
      .where(eq(questions.status, "active"));

    const [userStats] = await db
      .select({ total: count() })
      .from(users);

    const [answerStats] = await db
      .select({ total: count() })
      .from(answers)
      .where(eq(answers.status, "active"));

    const popularTags = await db
      .select()
      .from(tags)
      .orderBy(desc(tags.questionCount))
      .limit(10);

    const recentQuestions = await db.query.questions.findMany({
      where: eq(questions.status, "active"),
      with: {
        author: true,
        category: true,
        questionTags: { with: { tag: true } },
      },
      orderBy: [desc(questions.createdAt)],
      limit: 10,
    });

    return {
      stats: {
        questions: questionStats.total,
        answers: answerStats.total,
        users: userStats.total,
        views: questionStats.totalViews || 0,
      },
      popularTags,
      recentQuestions,
    };
  }),
});

export type AppRouter = typeof appRouter;
