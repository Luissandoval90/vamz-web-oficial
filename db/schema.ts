import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username"),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const resources = sqliteTable(
  "resources",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    path: text("path").notNull(),
    title: text("title"),
    description: text("description"),
    coverPath: text("cover_path"),
    fileSize: integer("file_size").notNull().default(0),
    coverSize: integer("cover_size").notNull().default(0),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(false),
    publishedAt: text("published_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdIdx: index("resources_user_id_idx").on(table.userId),
    publishedIdx: index("resources_is_published_idx").on(table.isPublished),
  }),
);

export const socialLinks = sqliteTable("social_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  icon: text("icon").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`),
});

export const minecraftVersions = sqliteTable("minecraft_versions", {
  resourceId: text("resource_id")
    .primaryKey()
    .references(() => resources.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  edition: text("edition", { enum: ["Bedrock", "Java"] }).notNull(),
  platform: text("platform", {
    enum: ["Android", "Windows", "macOS", "Linux", "Multiplataforma"],
  }).notNull(),
});

export const resourceStats = sqliteTable("resource_stats", {
  resourceId: text("resource_id")
    .primaryKey()
    .references(() => resources.id, { onDelete: "cascade" }),
  views: integer("views").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
});

export const resourceEvents = sqliteTable(
  "resource_events",
  {
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["view", "download"] }).notNull(),
    visitorHash: text("visitor_hash").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.resourceId, table.kind, table.visitorHash] }),
    index("resource_events_expiry_idx").on(table.expiresAt),
  ],
);

export const resourceReviews = sqliteTable(
  "resource_reviews",
  {
    id: text("id").primaryKey(),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    isApproved: integer("is_approved", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("resource_reviews_owner_idx").on(
      table.resourceId,
      table.userId,
    ),
    index("resource_reviews_public_idx").on(
      table.resourceId,
      table.isApproved,
      table.createdAt,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  user: one(users, {
    fields: [resources.userId],
    references: [users.id],
  }),
}));
