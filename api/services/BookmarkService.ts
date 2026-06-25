/**
 * BookmarkService - OOD Business Logic Layer for Bookmarks
 */

import { getDb } from "../queries/connection";
import { bookmarks } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export class BookmarkService {
  static async toggle(questionId: number, userId: number) {
    const db = getDb();

    // Check if bookmark exists
    const [existing] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.questionId, questionId),
          eq(bookmarks.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      // Remove bookmark
      await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
      return { bookmarked: false };
    } else {
      // Add bookmark
      await db.insert(bookmarks).values({
        questionId,
        userId,
      });
      return { bookmarked: true };
    }
  }

  static async findByUser(userId: number) {
    const db = getDb();
    return db.query.bookmarks.findMany({
      where: eq(bookmarks.userId, userId),
      with: {
        question: {
          with: {
            author: true,
            category: true,
            questionTags: { with: { tag: true } },
          },
        },
      },
      orderBy: [desc(bookmarks.createdAt)],
    });
  }

  static async isBookmarked(questionId: number, userId: number) {
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
}
