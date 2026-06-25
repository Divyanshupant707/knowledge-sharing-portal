/**
 * SearchService - Simulates ElasticSearch functionality
 * Uses in-memory indexing for high-speed resource discovery
 * In production, this would connect to an actual ElasticSearch cluster
 */

import { getDb } from "../queries/connection";
import {
  questions,
  answers,
  users,
  tags,
  categories,
} from "@db/schema";
import { eq } from "drizzle-orm";

// In-memory search index for high-speed lookups
interface SearchDocument {
  id: number;
  type: "question" | "answer" | "user" | "tag" | "category";
  title: string;
  content: string;
  tags?: string[];
  author?: string;
  score: number;
  createdAt: Date;
}

class SearchIndex {
  private documents: Map<string, SearchDocument> = new Map();
  private termIndex: Map<string, Set<string>> = new Map();
  private lastRebuild: number = 0;
  private readonly REBUILD_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  private addToIndex(key: string, doc: SearchDocument) {
    this.documents.set(key, doc);
    const tokens = [
      ...this.tokenize(doc.title),
      ...this.tokenize(doc.content),
      ...(doc.tags || []).map((t) => t.toLowerCase()),
      ...(doc.author ? this.tokenize(doc.author) : []),
    ];

    for (const token of tokens) {
      if (!this.termIndex.has(token)) {
        this.termIndex.set(token, new Set());
      }
      this.termIndex.get(token)!.add(key);
    }
  }

  async rebuild() {
    const now = Date.now();
    if (now - this.lastRebuild < this.REBUILD_INTERVAL && this.documents.size > 0) {
      return;
    }

    this.documents.clear();
    this.termIndex.clear();
    const db = getDb();

    // Index questions
    const allQuestions = await db.query.questions.findMany({
      where: eq(questions.status, "active"),
      with: {
        author: true,
        category: true,
        questionTags: { with: { tag: true } },
      },
    });

    for (const q of allQuestions) {
      const key = `question:${q.id}`;
      this.addToIndex(key, {
        id: q.id,
        type: "question",
        title: q.title,
        content: q.content,
        tags: q.questionTags.map((qt) => qt.tag.name),
        author: q.author?.name || undefined,
        score: q.voteCount * 10 + q.viewCount + q.answerCount * 5,
        createdAt: q.createdAt,
      });
    }

    // Index answers
    const allAnswers = await db.query.answers.findMany({
      where: eq(answers.status, "active"),
      with: { author: true },
    });

    for (const a of allAnswers) {
      const key = `answer:${a.id}`;
      this.addToIndex(key, {
        id: a.id,
        type: "answer",
        title: `Answer to question #${a.questionId}`,
        content: a.content,
        author: a.author?.name || undefined,
        score: a.voteCount * 10,
        createdAt: a.createdAt,
      });
    }

    // Index users
    const allUsers = await db.select().from(users);
    for (const u of allUsers) {
      const key = `user:${u.id}`;
      this.addToIndex(key, {
        id: u.id,
        type: "user",
        title: u.name || "Anonymous",
        content: u.bio || "",
        author: u.name || undefined,
        score: u.reputation,
        createdAt: u.createdAt,
      });
    }

    // Index tags
    const allTags = await db.select().from(tags);
    for (const t of allTags) {
      const key = `tag:${t.id}`;
      this.addToIndex(key, {
        id: t.id,
        type: "tag",
        title: t.name,
        content: t.description || "",
        score: t.questionCount,
        createdAt: t.createdAt,
      });
    }

    // Index categories
    const allCategories = await db.select().from(categories);
    for (const c of allCategories) {
      const key = `category:${c.id}`;
      this.addToIndex(key, {
        id: c.id,
        type: "category",
        title: c.name,
        content: c.description || "",
        score: c.questionCount,
        createdAt: c.createdAt,
      });
    }

    this.lastRebuild = now;
  }

  search(query: string, filters?: { type?: string; tags?: string[] }): SearchDocument[] {
    const tokens = this.tokenize(query);
    if (tokens.length === 0) return [];

    const matches = new Map<string, number>();

    for (const token of tokens) {
      // Exact prefix matching for fast results
      for (const [indexedTerm, keys] of this.termIndex) {
        if (indexedTerm.includes(token) || token.includes(indexedTerm)) {
          for (const key of keys) {
            const doc = this.documents.get(key);
            if (!doc) continue;

            // Apply type filter
            if (filters?.type && doc.type !== filters.type) continue;

            // Apply tag filter
            if (filters?.tags && filters.tags.length > 0) {
              const docTags = doc.tags || [];
              if (!filters.tags.some((t) => docTags.includes(t))) continue;
            }

            const score = (matches.get(key) || 0) + 1;
            matches.set(key, score);
          }
        }
      }
    }

    // Score and sort
    const results: SearchDocument[] = [];
    for (const [key, matchScore] of matches) {
      const doc = this.documents.get(key);
      if (doc) {
        results.push({ ...doc, score: doc.score + matchScore * 100 });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  suggest(query: string): string[] {
    if (query.length < 2) return [];
    const prefix = query.toLowerCase();
    const suggestions: string[] = [];

    for (const [term] of this.termIndex) {
      if (term.startsWith(prefix) && term !== prefix) {
        suggestions.push(term);
      }
      if (suggestions.length >= 10) break;
    }

    return suggestions;
  }
}

// Singleton instance
const searchIndex = new SearchIndex();

export class SearchService {
  static async search(
    query: string,
    options?: {
      type?: "question" | "answer" | "user" | "tag" | "category";
      tags?: string[];
      limit?: number;
      offset?: number;
    }
  ) {
    await searchIndex.rebuild();

    const results = searchIndex.search(query, {
      type: options?.type,
      tags: options?.tags,
    });

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return {
      results: results.slice(offset, offset + limit),
      total: results.length,
    };
  }

  static async quickSearch(query: string, limit: number = 5) {
    await searchIndex.rebuild();
    const results = searchIndex.search(query);
    return results.slice(0, limit);
  }

  static async getSuggestions(query: string) {
    await searchIndex.rebuild();
    return searchIndex.suggest(query);
  }

  // Force index rebuild - useful after mutations
  static async reindex() {
    searchIndex["lastRebuild"] = 0;
    await searchIndex.rebuild();
  }
}
