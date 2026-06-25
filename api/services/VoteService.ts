/**
 * VoteService - OOD Business Logic Layer for Voting
 * Handles upvotes/downvotes on questions and answers
 */

import { getDb } from "../queries/connection";
import { votes, questions, answers, users } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export type VoteTargetType = "question" | "answer";

export class VoteService {
  static async vote(
    targetType: VoteTargetType,
    targetId: number,
    userId: number,
    value: number
  ) {
    const db = getDb();

    if (value !== 1 && value !== -1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Vote value must be 1 (upvote) or -1 (downvote)",
      });
    }

    // Check if user already voted
    const [existingVote] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.targetType, targetType),
          eq(votes.targetId, targetId),
          eq(votes.userId, userId)
        )
      )
      .limit(1);

    const table = targetType === "question" ? questions : answers;
    const idField = targetType === "question" ? questions.id : answers.id;
    const voteField =
      targetType === "question" ? questions.voteCount : answers.voteCount;

    // Get target to find author for reputation updates
    const [target] = await db
      .select()
      .from(table)
      .where(eq(idField, targetId))
      .limit(1);

    if (!target) {
      throw new TRPCError({ code: "NOT_FOUND", message: `${targetType} not found` });
    }

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote (toggle off)
        await db.delete(votes).where(eq(votes.id, existingVote.id));
        await db
          .update(table)
          .set({ voteCount: sql`${voteField} - ${value}` })
          .where(eq(idField, targetId));

        // Update author reputation
        const authorId =
          targetType === "question"
            ? (target as typeof questions.$inferSelect).authorId
            : (target as typeof answers.$inferSelect).authorId;

        await db
          .update(users)
          .set({
            reputation: sql`GREATEST(${users.reputation} - ${value * 10}, 0)`,
          })
          .where(eq(users.id, authorId));

        return { value: 0 };
      } else {
        // Change vote direction
        await db
          .update(votes)
          .set({ value })
          .where(eq(votes.id, existingVote.id));

        // Adjust vote count: remove old, add new
        const adjustment = value - existingVote.value;
        await db
          .update(table)
          .set({ voteCount: sql`${voteField} + ${adjustment}` })
          .where(eq(idField, targetId));

        // Update author reputation
        const authorId =
          targetType === "question"
            ? (target as typeof questions.$inferSelect).authorId
            : (target as typeof answers.$inferSelect).authorId;

        await db
          .update(users)
          .set({
            reputation: sql`GREATEST(${users.reputation} + ${adjustment * 10}, 0)`,
          })
          .where(eq(users.id, authorId));

        return { value };
      }
    } else {
      // New vote
      await db.insert(votes).values({
        targetType,
        targetId,
        userId,
        value,
      });

      await db
        .update(table)
        .set({ voteCount: sql`${voteField} + ${value}` })
        .where(eq(idField, targetId));

      // Update author reputation
      const authorId =
        targetType === "question"
          ? (target as typeof questions.$inferSelect).authorId
          : (target as typeof answers.$inferSelect).authorId;

      await db
        .update(users)
        .set({
          reputation: sql`${users.reputation} + ${value * 10}`,
        })
        .where(eq(users.id, authorId));

      return { value };
    }
  }

  static async getVote(
    targetType: VoteTargetType,
    targetId: number,
    userId: number
  ) {
    const db = getDb();
    const [vote] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.targetType, targetType),
          eq(votes.targetId, targetId),
          eq(votes.userId, userId)
        )
      )
      .limit(1);

    return vote ? vote.value : 0;
  }
}
