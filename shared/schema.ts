import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const urlResults = pgTable("url_results", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  h1Texts: text("h1_texts").array(),
  error: text("error"),
});

export const moreTagResults = pgTable("more_tag_results", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  h1Texts: text("h1_texts").array(),
  h2Texts: text("h2_texts").array(),
  h3Texts: text("h3_texts").array(),
  error: text("error"),
});

export const insertUrlSchema = z.object({
  urls: z.string().array(),
});

export type InsertUrls = z.infer<typeof insertUrlSchema>;
export type UrlResult = typeof urlResults.$inferSelect;
export type MoreTagResult = typeof moreTagResults.$inferSelect;