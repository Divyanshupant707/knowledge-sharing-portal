/**
 * QuestionService - OOD Business Logic Layer
 * Handles all question-related operations with proper encapsulation
 */

import { getDb } from "../queries/connection";
import {
  questions,
  questionTags,
  tags,
  bookmarks,
  votes,
  questionViews,
  categories,
  users,
} from "@db/schema";
import { eq, and, desc, sql, like, or, count } from "drizzle-orm";
import { SearchService } from "./SearchService";
import { TRPCError } from "@trpc/server";

export interface CreateQuestionInput {
  title: string;
  content: string;
  categoryId: number;
  tagNames: string[];
  authorId: number;
}

export interface UpdateQuestionInput {
  title?: string;
  content?: string;
  categoryId?: number;
  tagNames?: string[];
}

export class QuestionService {
  static async create(input: CreateQuestionInput) {
    const db = getDb();
    const slug = this.generateSlug(input.title);

    const [result] = await db.insert(questions).values({
      title: input.title,
      content: input.content,
      slug,
      authorId: input.authorId,
      categoryId: input.categoryId,
    }).$returningId();

    const questionId = result.id;

    // Create or find tags and link them
    if (input.tagNames.length > 0) {
      await this.linkTags(questionId, input.tagNames);
    }

    // Update category question count
    await db
      .update(categories)
      .set({
        questionCount: sql`${categories.questionCount} + 1`,
      })
      .where(eq(categories.id, input.categoryId));

    // Increment user reputation
    await db
      .update(users)
      .set({ reputation: sql`${users.reputation} + 5` })
      .where(eq(users.id, input.authorId));

    await SearchService.reindex();

    return this.findById(questionId);
  }

  static async findById(id: number, userId?: number) {
    const db = getDb();
    const question = await db.query.questions.findFirst({
      where: and(eq(questions.id, id), eq(questions.status, "active")),
      with: {
        author: true,
        category: true,
        questionTags: { with: { tag: true } },
        bookmarks: userId ? { where: eq(bookmarks.userId, userId) } : undefined,
      },
    });

    if (!question) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" });
    }

    return question;
  }

  static async findBySlug(slug: string, userId?: number) {
    const db = getDb();
    const question = await db.query.questions.findFirst({
      where: and(eq(questions.slug, slug), eq(questions.status, "active")),
      with: {
        author: true,
        category: true,
        questionTags: { with: { tag: true } },
        bookmarks: userId ? { where: eq(bookmarks.userId, userId) } : undefined,
      },
    });

    if (!question) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" });
    }

    return question;
  }

  static async findAll(options: {
    categoryId?: number;
    tagId?: number;
    authorId?: number;
    status?: "active" | "closed";
    sortBy?: "newest" | "popular" | "unanswered" | "votes";
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const db = getDb();
    const {
      categoryId,
      tagId,
      authorId,
      status = "active",
      sortBy = "newest",
      search,
      limit = 20,
      offset = 0,
    } = options;

    // Build conditions
    const conditions = [eq(questions.status, status)];

    if (categoryId) {
      conditions.push(eq(questions.categoryId, categoryId));
    }
    if (authorId) {
      conditions.push(eq(questions.authorId, authorId));
    }

    // Determine order
    let orderBy;
    switch (sortBy) {
      case "popular":
        orderBy = desc(questions.viewCount);
        break;
      case "votes":
        orderBy = desc(questions.voteCount);
        break;
      default:
        orderBy = desc(questions.createdAt);
    }

    // Get questions matching conditions
    let whereCondition = and(...conditions);
    
    // Add search if provided
    if (search) {
      whereCondition = and(
        whereCondition,
        or(
          like(questions.title, `%${search}%`),
          like(questions.content, `%${search}%`)
        )
      );
    }

    // Filter by tag if specified
    let questionIds: number[] | null = null;
    if (tagId) {
      const tagQuestionLinks = await db
        .select({ questionId: questionTags.questionId })
        .from(questionTags)
        .where(eq(questionTags.tagId, tagId));
      questionIds = tagQuestionLinks.map((t) => t.questionId);
      if (questionIds.length === 0) {
        return { questions: [], total: 0 };
      }
    }

    const results = await db
      .select()
      .from(questions)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Filter by tag question IDs if needed
    const filteredResults = questionIds
      ? results.filter((q) => questionIds!.includes(q.id))
      : results;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(questions)
      .where(whereCondition);

    // Enrich with author and tags
    const enriched = await Promise.all(
      filteredResults.map(async (q) => {
        const author = await db.query.users.findFirst({
          where: eq(users.id, q.authorId),
        });
        const qTags = await db
          .select({ name: tags.name })
          .from(questionTags)
          .innerJoin(tags, eq(questionTags.tagId, tags.id))
          .where(eq(questionTags.questionId, q.id));

        return { ...q, author, tags: qTags.map((t) => t.name) };
      })
    );

    return {
      questions: enriched,
      total: totalResult.count,
    };
  }

  static async update(id: number, userId: number, input: UpdateQuestionInput) {
    const db = getDb();
    const question = await this.findById(id);

    if (question.authorId !== userId && question.author?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not authorized to edit this question",
      });
    }

    const updates: Record<string, unknown> = {};
    if (input.title) updates.title = input.title;
    if (input.content) updates.content = input.content;
    if (input.categoryId) updates.categoryId = input.categoryId;

    await db.update(questions).set(updates).where(eq(questions.id, id));

    if (input.tagNames && input.tagNames.length > 0) {
      // Remove old tags
      await db.delete(questionTags).where(eq(questionTags.questionId, id));
      // Add new tags
      await this.linkTags(id, input.tagNames);
    }

    await SearchService.reindex();
    return this.findById(id);
  }

  static async delete(id: number, userId: number, isAdmin: boolean = false) {
    const db = getDb();
    const question = await this.findById(id);

    if (question.authorId !== userId && !isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not authorized to delete this question",
      });
    }

    await db
      .update(questions)
      .set({ status: "deleted" })
      .where(eq(questions.id, id));

    // Update category count
    await db
      .update(categories)
      .set({
        questionCount: sql`GREATEST(${categories.questionCount} - 1, 0)`,
      })
      .where(eq(categories.id, question.categoryId));

    await SearchService.reindex();
    return { success: true };
  }

  static async recordView(questionId: number, userId?: number) {
    const db = getDb();

    // Check if already viewed recently
    let alreadyViewed = false;
    if (userId) {
      const [existing] = await db
        .select()
        .from(questionViews)
        .where(
          and(
            eq(questionViews.questionId, questionId),
            eq(questionViews.userId, userId)
          )
        )
        .limit(1);
      alreadyViewed = !!existing;
    }

    if (!alreadyViewed) {
      await db.insert(questionViews).values({
        questionId,
        userId: userId || null,
      });

      await db
        .update(questions)
        .set({ viewCount: sql`${questions.viewCount} + 1` })
        .where(eq(questions.id, questionId));
    }
  }

  static async getVoteStatus(questionId: number, userId: number) {
    const db = getDb();
    const [vote] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.targetType, "question"),
          eq(votes.targetId, questionId),
          eq(votes.userId, userId)
        )
      )
      .limit(1);

    return vote ? vote.value : 0;
  }

  static async getBookmarkStatus(questionId: number, userId: number) {
    const db = getDb();
    const [bm] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.questionId, questionId),
          eq(bookmarks.userId, userId)
        )
      )
      .limit(1);

    return !!bm;
  }

  static async getStats() {
    const db = getDb();
    const [result] = await db
      .select({
        total: count(),
        totalViews: sql<number>`SUM(${questions.viewCount})`,
        totalVotes: sql<number>`SUM(${questions.voteCount})`,
        totalAnswers: sql<number>`SUM(${questions.answerCount})`,
      })
      .from(questions)
      .where(eq(questions.status, "active"));

    return result;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────

  private static generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);
    return `${base}-${Date.now()}`;
  }

  private static async linkTags(questionId: number, tagNames: string[]) {
    const db = getDb();

    for (const name of tagNames) {
      const normalized = name.trim().toLowerCase();
      if (!normalized) continue;

      let existingTag = await db.query.tags.findFirst({
        where: eq(tags.name, normalized),
      });

      if (!existingTag) {
        const [result] = await db
          .insert(tags)
          .values({ name: normalized, questionCount: 1 })
          .$returningId();
        existingTag = await db.query.tags.findFirst({
          where: eq(tags.id, result.id),
        });
      } else {
        await db
          .update(tags)
          .set({ questionCount: sql`${tags.questionCount} + 1` })
          .where(eq(tags.id, existingTag!.id));
      }

      if (existingTag) {
        await db.insert(questionTags).values({
          questionId,
          tagId: existingTag.id,
        });
      }
    }
  }
}
