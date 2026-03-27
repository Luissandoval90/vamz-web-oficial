import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username"),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
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
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
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

export const usersRelations = relations(users, ({ many }) => ({
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  user: one(users, {
    fields: [resources.userId],
    references: [users.id],
  }),
}));
