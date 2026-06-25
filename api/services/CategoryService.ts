/**
 * CategoryService - OOD Business Logic Layer for Categories
 */

import { getDb } from "../queries/connection";
import { categories, questions } from "@db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export interface CreateCategoryInput {
  name: string;
  description?: string;
  slug?: string;
}

export class CategoryService {
  static async create(input: CreateCategoryInput) {
    const db = getDb();
    const slug =
      input.slug ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-");

    // Check for duplicate
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Category with this slug already exists",
      });
    }

    const [result] = await db
      .insert(categories)
      .values({
        name: input.name,
        description: input.description,
        slug,
      })
      .$returningId();

    return db.query.categories.findFirst({
      where: eq(categories.id, result.id),
    });
  }

  static async findAll() {
    const db = getDb();
    return db.select().from(categories).orderBy(categories.name);
  }

  static async findBySlug(slug: string) {
    const db = getDb();
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (!category) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
    }

    return category;
  }

  static async findById(id: number) {
    const db = getDb();
    return db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
  }

  static async getQuestions(
    categoryId: number,
    options?: { limit?: number; offset?: number }
  ) {
    const db = getDb();
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const results = await db.query.questions.findMany({
      where: and(
        eq(questions.categoryId, categoryId),
        eq(questions.status, "active")
      ),
      with: {
        author: true,
        questionTags: { with: { tag: true } },
      },
      orderBy: [desc(questions.createdAt)],
      limit,
      offset,
    });

    const [totalResult] = await db
      .select({ count: count() })
      .from(questions)
      .where(
        and(
          eq(questions.categoryId, categoryId),
          eq(questions.status, "active")
        )
      );

    return { questions: results, total: totalResult.count };
  }

  static async getStats() {
    const db = getDb();
    const [result] = await db
      .select({
        total: count(),
        totalQuestions: sql<number>`SUM(${categories.questionCount})`,
      })
      .from(categories);

    return result;
  }
}
