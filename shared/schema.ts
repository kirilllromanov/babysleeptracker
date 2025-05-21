import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Child profile schema
export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  birthDate: timestamp("birth_date").notNull(),
  gender: text("gender").notNull(),
});

export const insertChildSchema = createInsertSchema(children, {
  birthDate: z.coerce.date({
    required_error: "Please select a birth date",
    invalid_type_error: "That's not a valid date",
  }),
}).pick({
  name: true,
  birthDate: true,
  gender: true,
});

export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof children.$inferSelect;

// Sleep records schema
export const sleepRecords = pgTable("sleep_records", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").default(true),
  quality: text("quality"),
});

export const insertSleepRecordSchema = z.object({
  childId: z.number(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().nullable(),
  isActive: z.boolean(),
  quality: z.string().nullable(),
}).refine(data => {
  if (data.endTime && data.startTime >= data.endTime) {
    throw new Error("End time must be after start time");
  }
  return true;
});

export const updateSleepRecordSchema = createInsertSchema(sleepRecords).pick({
  endTime: true,
  isActive: true,
  quality: true,
});

export type InsertSleepRecord = z.infer<typeof insertSleepRecordSchema>;
export type UpdateSleepRecord = z.infer<typeof updateSleepRecordSchema>;
export type SleepRecord = typeof sleepRecords.$inferSelect;

// Sleep predictions schema
export const sleepPredictions = pgTable("sleep_predictions", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  predictedTime: timestamp("predicted_time").notNull(),
  predictedDuration: integer("predicted_duration").notNull(), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSleepPredictionSchema = createInsertSchema(sleepPredictions).pick({
  childId: true,
  predictedTime: true,
  predictedDuration: true,
});

export type InsertSleepPrediction = z.infer<typeof insertSleepPredictionSchema>;
export type SleepPrediction = typeof sleepPredictions.$inferSelect;

// Keep user schema for authentication if needed
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;