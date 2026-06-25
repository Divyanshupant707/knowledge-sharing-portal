/**
 * AnswerService - OOD Business Logic Layer for Answers
 */

import { getDb } from "../queries/connection";
import { answers, questions, users, comments } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { SearchService } from "./SearchService";

export interface CreateAnswerInput {
  content: string;
  questionId: number;
  authorId: number;
}

export interface UpdateAnswerInput {
  content: string;
}

export class AnswerService {
  static async create(input: CreateAnswerInput) {
    const db = getDb();

    // Verify question exists and is active
    const question = await db.query.questions.findFirst({
      where: and(
        eq(questions.id, input.questionId),
        eq(questions.status, "active")
      ),
    });

    if (!question) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" });
    }

    if (question.isClosed) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This question is closed and cannot receive new answers",
      });
    }

    const [result] = await db.insert(answers).values({
      content: input.content,
      questionId: input.questionId,
      authorId: input.authorId,
    }).$returningId();

    // Update question answer count
    await db
      .update(questions)
      .set({ answerCount: sql`${questions.answerCount} + 1` })
      .where(eq(questions.id, input.questionId));

    // Update user reputation
    await db
      .update(users)
      .set({ reputation: sql`${users.reputation} + 10` })
      .where(eq(users.id, input.authorId));

    await SearchService.reindex();

    return this.findById(result.id);
  }

  static async findById(id: number) {
    const db = getDb();
    const answer = await db.query.answers.findFirst({
      where: and(eq(answers.id, id), eq(answers.status, "active")),
      with: { author: true },
    });

    if (!answer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Answer not found" });
    }

    return answer;
  }

  static async findByQuestion(questionId: number) {
    const db = getDb();
    return db.query.answers.findMany({
      where: and(
        eq(answers.questionId, questionId),
        eq(answers.status, "active")
      ),
      with: { author: true },
      orderBy: [desc(answers.isAccepted), desc(answers.voteCount), desc(answers.createdAt)],
    });
  }

  static async update(id: number, userId: number, input: UpdateAnswerInput) {
    const db = getDb();
    const answer = await this.findById(id);

    if (answer.authorId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not authorized to edit this answer",
      });
    }

    await db
      .update(answers)
      .set({ content: input.content })
      .where(eq(answers.id, id));

    await SearchService.reindex();
    return this.findById(id);
  }

  static async delete(id: number, userId: number, isAdmin: boolean = false) {
    const db = getDb();
    const answer = await this.findById(id);

    if (answer.authorId !== userId && !isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not authorized to delete this answer",
      });
    }

    await db
      .update(answers)
      .set({ status: "deleted" })
      .where(eq(answers.id, id));

    // Update question answer count
    await db
      .update(questions)
      .set({ answerCount: sql`GREATEST(${questions.answerCount} - 1, 0)` })
      .where(eq(questions.id, answer.questionId));

    await SearchService.reindex();
    return { success: true };
  }

  static async accept(id: number, userId: number, isAdmin: boolean = false) {
    const db = getDb();
    const answer = await this.findById(id);

    // Get question to verify ownership
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, answer.questionId),
    });

    if (!question) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" });
    }

    if (question.authorId !== userId && !isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the question author can accept an answer",
      });
    }

    // Unaccept any previously accepted answer
    await db
      .update(answers)
      .set({ isAccepted: false })
      .where(eq(answers.questionId, answer.questionId));

    // Accept this answer
    await db
      .update(answers)
      .set({ isAccepted: true })
      .where(eq(answers.id, id));

    // Update question
    await db
      .update(questions)
      .set({ isAcceptedAnswer: true })
      .where(eq(questions.id, answer.questionId));

    // Award reputation to answer author
    await db
      .update(users)
      .set({ reputation: sql`${users.reputation} + 25` })
      .where(eq(users.id, answer.authorId));

    return this.findById(id);
  }

  static async getComments(answerId: number) {
    const db = getDb();
    return db.query.comments.findMany({
      where: and(
        eq(comments.parentType, "answer"),
        eq(comments.parentId, answerId),
        eq(comments.status, "active")
      ),
      with: { author: true },
      orderBy: [desc(comments.createdAt)],
    });
  }
}
