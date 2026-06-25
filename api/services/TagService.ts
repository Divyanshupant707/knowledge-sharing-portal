/**
 * TagService - OOD Business Logic Layer for Tags
 */

import { getDb } from "../queries/connection";
import { tags, questionTags, questions } from "@db/schema";
import { eq, desc, like, count, sql } from "drizzle-orm";

export class TagService {
  static async findAll(options?: { search?: string; limit?: number; offset?: number }) {
    const db = getDb();
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let results;
    if (options?.search) {
      results = await db
        .select()
        .from(tags)
        .where(like(tags.name, `%${options.search}%`))
        .orderBy(desc(tags.questionCount))
        .limit(limit)
        .offset(offset);
    } else {
      results = await db
        .select()
        .from(tags)
        .orderBy(desc(tags.questionCount))
        .limit(limit)
        .offset(offset);
    }

    const [totalResult] = await db.select({ count: count() }).from(tags);

    return { tags: results, total: totalResult.count };
  }

  static async findPopular(limit: number = 20) {
    const db = getDb();
    return db
      .select()
      .from(tags)
      .orderBy(desc(tags.questionCount))
      .limit(limit);
  }

  static async findByName(name: string) {
    const db = getDb();
    return db.query.tags.findFirst({
      where: eq(tags.name, name.toLowerCase()),
    });
  }

  static async getQuestions(
    tagId: number,
    options?: { limit?: number; offset?: number }
  ) {
    const db = getDb();
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const results = await db
      .select({
        questionId: questionTags.questionId,
      })
      .from(questionTags)
      .where(eq(questionTags.tagId, tagId))
      .limit(limit)
      .offset(offset);

    const questionIds = results.map((r) => r.questionId);

    if (questionIds.length === 0) {
      return { questions: [], total: 0 };
    }

    const questions_data = await db.query.questions.findMany({
      where: sql`${questions.id} IN (${questionIds.join(",")})`,
      with: {
        author: true,
        questionTags: { with: { tag: true } },
      },
      orderBy: [desc(questions.createdAt)],
    });

    const [totalResult] = await db
      .select({ count: count() })
      .from(questionTags)
      .where(eq(questionTags.tagId, tagId));

    return { questions: questions_data, total: totalResult.count };
  }

  static async getStats() {
    const db = getDb();
    const [result] = await db
      .select({
        total: count(),
        totalUsages: sql<number>`SUM(${tags.questionCount})`,
      })
      .from(tags);

    return result;
  }
}
