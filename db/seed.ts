/**
 * Seed script to populate the database with sample data
 * Run with: npx tsx db/seed.ts
 */

import { getDb } from "../api/queries/connection";
import {
  users,
  categories,
  tags,
  questions,
  questionTags,
  answers,
  comments,
  votes,
} from "./schema";
import { sql } from "drizzle-orm";

const avatars = [
  "/avatar1.jpg",
  "/avatar2.jpg",
  "/avatar3.jpg",
  "/avatar4.jpg",
  "/avatar5.jpg",
];

async function seed() {
  console.log("🌱 Seeding database...");
  const db = getDb();

  // Clean existing data (be careful in production!)
  console.log("Cleaning existing data...");
  await db.delete(votes);
  await db.delete(comments);
  await db.delete(answers);
  await db.delete(questionTags);
  await db.delete(questions);
  await db.delete(tags);
  await db.delete(categories);

  // Create categories
  console.log("Creating categories...");
  const categoryData = [
    { name: "Backend Development", description: "Server-side programming, APIs, databases", slug: "backend" },
    { name: "Frontend Development", description: "UI/UX, React, CSS, browser technologies", slug: "frontend" },
    { name: "DevOps & Cloud", description: "CI/CD, Docker, AWS, infrastructure", slug: "devops" },
    { name: "Database Design", description: "SQL, NoSQL, data modeling, optimization", slug: "database" },
    { name: "System Design", description: "Architecture, scalability, microservices", slug: "system-design" },
    { name: "Security", description: "Authentication, authorization, best practices", slug: "security" },
  ];

  const createdCategories = [];
  for (const cat of categoryData) {
    const [result] = await db.insert(categories).values(cat).$returningId();
    const created = await db.query.categories.findFirst({ where: sql`${categories.id} = ${result.id}` });
    if (created) createdCategories.push(created);
  }

  // Create tags
  console.log("Creating tags...");
  const tagNames = [
    "nodejs", "react", "typescript", "javascript", "python",
    "docker", "kubernetes", "aws", "mongodb", "postgresql",
    "redis", "graphql", "rest-api", "microservices", "elasticsearch",
    "oauth", "jwt", "rbac", "sql", "nosql",
    "ci-cd", "terraform", "nginx", "express", "nextjs",
  ];

  const createdTags = [];
  for (const name of tagNames) {
    const [result] = await db.insert(tags).values({ name, questionCount: 0 }).$returningId();
    const created = await db.query.tags.findFirst({ where: sql`${tags.id} = ${result.id}` });
    if (created) createdTags.push(created);
  }

  // Create sample users (NOTE: These are mock users for display purposes)
  // In a real app, users would be created via OAuth login
  console.log("Creating sample content...");

  // Create questions
  const questionData = [
    {
      title: "How to implement RBAC in a Node.js application?",
      content: `I'm building a multi-tenant application and need to implement Role-Based Access Control (RBAC).\n\nI've been looking at different approaches:\n\n1. Using a middleware-based approach with Express\n2. Implementing policy-based access control\n3. Using a library like @casl/ability\n\nWhat's the best practice for implementing RBAC in Node.js? Should I roll my own or use an existing library?\n\nMy requirements:\n- Multiple roles (admin, moderator, user)\n- Resource-level permissions\n- API endpoint protection`,
      categoryId: createdCategories[0].id,
      tagNames: ["nodejs", "rbac", "security", "express"],
      viewCount: 1250,
      voteCount: 42,
      answerCount: 5,
    },
    {
      title: "ElasticSearch vs PostgreSQL full-text search: which to choose?",
      content: `I'm designing a knowledge sharing platform and need high-speed search capabilities.\n\nCurrently considering:\n- PostgreSQL built-in full-text search\n- Dedicated ElasticSearch cluster\n\nOur dataset will have:\n- ~100K documents initially\n- Expected to grow to 1M+\n- Need faceted search, fuzzy matching, and highlighting\n\nWhat are the trade-offs? Is ElasticSearch worth the operational complexity?`,
      categoryId: createdCategories[3].id,
      tagNames: ["elasticsearch", "postgresql", "sql", "nosql"],
      viewCount: 980,
      voteCount: 38,
      answerCount: 4,
    },
    {
      title: "Best practices for Object-Oriented Design in large TypeScript projects?",
      content: `I'm working on a large-scale TypeScript project and want to ensure maintainability and modularity.\n\nKey concerns:\n- How to structure service classes\n- Repository pattern implementation\n- Dependency injection approaches\n- Avoiding circular dependencies\n\nWhat patterns have worked well for you in production TypeScript applications?`,
      categoryId: createdCategories[0].id,
      tagNames: ["typescript", "nodejs", "system-design"],
      viewCount: 1500,
      voteCount: 55,
      answerCount: 7,
    },
    {
      title: "How to scale a tRPC API with microservices architecture?",
      content: `Currently using tRPC for our monolithic API but considering a move to microservices.\n\nQuestions:\n- Can tRPC work across service boundaries?\n- How to handle shared types between services?\n- Performance implications of tRPC vs REST in microservices\n- Federation or gateway patterns?\n\nWould love to hear experiences from teams that have made this transition.`,
      categoryId: createdCategories[4].id,
      tagNames: ["microservices", "typescript", "rest-api", "graphql"],
      viewCount: 760,
      voteCount: 28,
      answerCount: 3,
    },
    {
      title: "Implementing OAuth 2.0 with JWT sessions: security considerations",
      content: `Building an authentication system with OAuth 2.0 and JWT tokens.\n\nCurrent approach:\n- Access tokens (15 min expiry)\n- Refresh tokens (7 day expiry)\n- httpOnly cookies for refresh tokens\n\nQuestions:\n- Should I store refresh tokens in the database?\n- How to handle token revocation?\n- Best practices for CSRF protection?\n- Rate limiting strategies for auth endpoints?`,
      categoryId: createdCategories[5].id,
      tagNames: ["oauth", "jwt", "security", "nodejs"],
      viewCount: 1100,
      voteCount: 45,
      answerCount: 6,
    },
    {
      title: "Docker Compose setup for local development with hot reload?",
      content: `Setting up a Docker Compose environment for a full-stack application:\n\nStack:\n- React frontend (Vite)\n- Node.js backend (Express)\n- PostgreSQL database\n- Redis cache\n\nWant to achieve:\n- Hot reload for both frontend and backend\n- Persistent database data\n- Shared volumes for code changes\n- Health checks for dependencies\n\nWhat's your preferred Docker Compose setup for this stack?`,
      categoryId: createdCategories[2].id,
      tagNames: ["docker", "devops", "ci-cd", "nodejs"],
      viewCount: 890,
      voteCount: 32,
      answerCount: 4,
    },
    {
      title: "React Query (TanStack Query) vs SWR for data fetching?",
      content: `Choosing between React Query and SWR for our React application's data fetching layer.\n\nKey requirements:\n- Server state management\n- Caching and invalidation\n- Optimistic updates\n- Offline support\n\nWhat are the main differences in 2024? Which would you recommend for a new project?`,
      categoryId: createdCategories[1].id,
      tagNames: ["react", "javascript", "frontend"],
      viewCount: 650,
      voteCount: 25,
      answerCount: 3,
    },
    {
      title: "When to use Redis vs PostgreSQL for caching?",
      content: `Trying to optimize our application performance and considering caching strategies.\n\nCurrent setup:\n- PostgreSQL as primary database\n- Some heavy read queries\n- User session data\n- Real-time analytics\n\nShould we use:\n1. PostgreSQL materialized views\n2. Redis for query caching\n3. Application-level caching\n4. CDN for static data\n\nWhat factors should guide this decision?`,
      categoryId: createdCategories[3].id,
      tagNames: ["redis", "postgresql", "sql", "nosql"],
      viewCount: 540,
      voteCount: 22,
      answerCount: 3,
    },
  ];

  // Generate slugs
  for (const q of questionData) {
    const slug = q.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) + `-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const [result] = await db.insert(questions).values({
      title: q.title,
      content: q.content,
      slug,
      authorId: 1, // Will be replaced by actual logged-in user
      categoryId: q.categoryId,
      viewCount: q.viewCount,
      voteCount: q.voteCount,
      answerCount: q.answerCount,
    }).$returningId();

    const questionId = result.id;

    // Link tags
    for (const tagName of q.tagNames) {
      const tag = createdTags.find((t) => t.name === tagName);
      if (tag) {
        await db.insert(questionTags).values({
          questionId,
          tagId: tag.id,
        });
        // Update tag question count
        await db.update(tags).set({
          questionCount: sql`${tags.questionCount} + 1`,
        }).where(sql`${tags.id} = ${tag.id}`);
      }
    }

    // Update category question count
    await db.update(categories).set({
      questionCount: sql`${categories.questionCount} + 1`,
    }).where(sql`${categories.id} = ${q.categoryId}`);
  }

  console.log("✅ Seed complete!");
  console.log(`  ${createdCategories.length} categories`);
  console.log(`  ${createdTags.length} tags`);
  console.log(`  ${questionData.length} questions`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
