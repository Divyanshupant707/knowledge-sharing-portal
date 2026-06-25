import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─── Users ─────────────────────────────────────────────────────────────
export const users = mysqlTable(
  "users",
  {
    id: serial("id").primaryKey(),
    unionId: varchar("unionId", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 320 }),
    avatar: text("avatar"),
    bio: text("bio"),
    reputation: int("reputation").default(0).notNull(),
    role: mysqlEnum("role", ["user", "moderator", "admin"])
      .default("user")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
  },
  (table) => ({
    roleIdx: index("role_idx").on(table.role),
    reputationIdx: index("reputation_idx").on(table.reputation),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ────────────────────────────────────────────────────────
export const categories = mysqlTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description"),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    questionCount: int("questionCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("slug_idx").on(table.slug),
  })
);

export type Category = typeof categories.$inferSelect;

// ─── Tags ──────────────────────────────────────────────────────────────
export const tags = mysqlTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull().unique(),
    description: text("description"),
    questionCount: int("questionCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("tag_name_idx").on(table.name),
  })
);

export type Tag = typeof tags.$inferSelect;

// ─── Questions ─────────────────────────────────────────────────────────
export const questions = mysqlTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 300 }).notNull(),
    content: text("content").notNull(),
    slug: varchar("slug", { length: 350 }).notNull(),
    authorId: bigint("authorId", { mode: "number", unsigned: true }).notNull(),
    categoryId: bigint("categoryId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    viewCount: int("viewCount").default(0).notNull(),
    voteCount: int("voteCount").default(0).notNull(),
    answerCount: int("answerCount").default(0).notNull(),
    isAcceptedAnswer: boolean("isAcceptedAnswer").default(false).notNull(),
    isClosed: boolean("isClosed").default(false).notNull(),
    status: mysqlEnum("status", ["active", "closed", "deleted"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    authorIdx: index("q_author_idx").on(table.authorId),
    categoryIdx: index("q_category_idx").on(table.categoryId),
    statusIdx: index("q_status_idx").on(table.status),
    createdAtIdx: index("q_created_idx").on(table.createdAt),
    slugIdx: uniqueIndex("q_slug_idx").on(table.slug),
  })
);

export type Question = typeof questions.$inferSelect;

// ─── Question Tags (many-to-many) ──────────────────────────────────────
export const questionTags = mysqlTable(
  "question_tags",
  {
    id: serial("id").primaryKey(),
    questionId: bigint("questionId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    tagId: bigint("tagId", { mode: "number", unsigned: true }).notNull(),
  },
  (table) => ({
    uniquePair: uniqueIndex("qt_pair_idx").on(table.questionId, table.tagId),
    tagIdx: index("qt_tag_idx").on(table.tagId),
  })
);

// ─── Answers ───────────────────────────────────────────────────────────
export const answers = mysqlTable(
  "answers",
  {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    questionId: bigint("questionId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    authorId: bigint("authorId", { mode: "number", unsigned: true }).notNull(),
    voteCount: int("voteCount").default(0).notNull(),
    isAccepted: boolean("isAccepted").default(false).notNull(),
    status: mysqlEnum("status", ["active", "deleted"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    questionIdx: index("a_question_idx").on(table.questionId),
    authorIdx: index("a_author_idx").on(table.authorId),
    statusIdx: index("a_status_idx").on(table.status),
  })
);

export type Answer = typeof answers.$inferSelect;

// ─── Comments ──────────────────────────────────────────────────────────
export const comments = mysqlTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    parentType: mysqlEnum("parentType", ["question", "answer"]).notNull(),
    parentId: bigint("parentId", { mode: "number", unsigned: true }).notNull(),
    authorId: bigint("authorId", { mode: "number", unsigned: true }).notNull(),
    status: mysqlEnum("status", ["active", "deleted"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    parentIdx: index("c_parent_idx").on(table.parentType, table.parentId),
    authorIdx: index("c_author_idx").on(table.authorId),
  })
);

export type Comment = typeof comments.$inferSelect;

// ─── Votes ─────────────────────────────────────────────────────────────
export const votes = mysqlTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    targetType: mysqlEnum("targetType", ["question", "answer"]).notNull(),
    targetId: bigint("targetId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    value: int("value").notNull(), // +1 or -1
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    uniqueVote: uniqueIndex("vote_unique_idx").on(
      table.targetType,
      table.targetId,
      table.userId
    ),
    targetIdx: index("vote_target_idx").on(table.targetType, table.targetId),
  })
);

// ─── Bookmarks ─────────────────────────────────────────────────────────
export const bookmarks = mysqlTable(
  "bookmarks",
  {
    id: serial("id").primaryKey(),
    questionId: bigint("questionId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    uniqueBookmark: uniqueIndex("bm_unique_idx").on(
      table.questionId,
      table.userId
    ),
    userIdx: index("bm_user_idx").on(table.userId),
  })
);

// ─── Question Views (track unique views) ───────────────────────────────
export const questionViews = mysqlTable(
  "question_views",
  {
    id: serial("id").primaryKey(),
    questionId: bigint("questionId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }), // nullable for anonymous
    ipAddress: varchar("ipAddress", { length: 45 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    questionIdx: index("qv_question_idx").on(table.questionId),
  })
);
