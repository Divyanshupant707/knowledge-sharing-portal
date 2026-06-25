import { relations } from "drizzle-orm";
import {
  users,
  questions,
  answers,
  comments,
  tags,
  questionTags,
  categories,
  bookmarks,
  votes,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  questions: many(questions),
  answers: many(answers),
  comments: many(comments),
  votes: many(votes),
  bookmarks: many(bookmarks),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  author: one(users, { fields: [questions.authorId], references: [users.id] }),
  category: one(categories, {
    fields: [questions.categoryId],
    references: [categories.id],
  }),
  answers: many(answers),
  comments: many(comments),
  questionTags: many(questionTags),
  bookmarks: many(bookmarks),
}));

export const answersRelations = relations(answers, ({ one, many }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  author: one(users, { fields: [answers.authorId], references: [users.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  questionTags: many(questionTags),
}));

export const questionTagsRelations = relations(questionTags, ({ one }) => ({
  question: one(questions, {
    fields: [questionTags.questionId],
    references: [questions.id],
  }),
  tag: one(tags, { fields: [questionTags.tagId], references: [tags.id] }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  question: one(questions, {
    fields: [bookmarks.questionId],
    references: [questions.id],
  }),
  user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, { fields: [votes.userId], references: [users.id] }),
}));
