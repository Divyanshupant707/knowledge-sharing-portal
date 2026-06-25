/**
 * CommentService - OOD Business Logic Layer for Comments
 */

import { getDb } from "../queries/connection";
import { comments, users } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export interface CreateCommentInput {
  content: string;
  parentType: "question" | "answer";
  parentId: number;
  authorId: number;
}

export class CommentService {
  static async create(input: CreateCommentInput) {
    const db = getDb();

    const [result] = await db.insert(comments).values({
      content: input.content,
      parentType: input.parentType,
      parentId: input.parentId,
      authorId: input.authorId,
    }).$returningId();

    // Update user reputation
    await db
      .update(users)
      .set({ reputation: sql`${users.reputation} + 2` })
      .where(eq(users.id, input.authorId));

    return this.findById(result.id);
  }

  static async findById(id: number) {
    const db = getDb();
    const comment = await db.query.comments.findFirst({
      where: and(eq(comments.id, id), eq(comments.status, "active")),
      with: { author: true },
    });

    if (!comment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
    }

    return comment;
  }

  static async findByParent(parentType: "question" | "answer", parentId: number) {
    const db = getDb();
    return db.query.comments.findMany({
      where: and(
        eq(comments.parentType, parentType),
        eq(comments.parentId, parentId),
        eq(comments.status, "active")
      ),
      with: { author: true },
      orderBy: [desc(comments.createdAt)],
    });
  }

  static async update(id: number, userId: number, content: string) {
    const db = getDb();
    const comment = await this.findById(id);

    if (comment.authorId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not authorized to edit this comment",
      });
    }

    await db
      .update(comments)
      .set({ content })
      .where(eq(comments.id, id));

    return this.findById(id);
  }

  static async delete(id: number, userId: number, isAdmin: boolean = false) {
    const db = getDb();
    const comment = await this.findById(id);

    if (comment.authorId !== userId && !isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not authorized to delete this comment",
      });
    }

    await db
      .update(comments)
      .set({ status: "deleted" })
      .where(eq(comments.id, id));

    return { success: true };
  }
}
