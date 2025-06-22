import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  nickname: text("nickname").notNull().unique(),
  age: text("age").notNull(),
  instagram: text("instagram"),
  password: text("password").notNull(),
  bio: text("bio"),
  interests: text("interests").array(),
  hobbies: text("hobbies"),
  profileImage: text("profile_image"),
  province: text("province"),
  school: text("school"),
  profileCompleted: boolean("profile_completed").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  province: text("province").notNull(),
  address: text("address"),
  googlePlaceId: text("google_place_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  userId1: integer("user_id_1").notNull().references(() => users.id),
  userId2: integer("user_id_2").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, matched, blocked
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // text, image
  imageUrl: text("image_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const loginSchema = z.object({
  nickname: z.string().min(1, "กรุณาใส่ชื่อเล่น"),
  password: z.string().min(1, "กรุณาใส่รหัสผ่าน"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

export const settingsSchema = z.object({
  profileImage: z.string().optional(),
  nickname: z.string().min(1, "กรุณาใส่ชื่อเล่น"),
  age: z.string().min(1, "กรุณาเลือกช่วงอายุ"),
  instagram: z.string().optional(),
  bio: z.string().optional().refine((val) => !val || val.length >= 10, {
    message: "แนะนำตัวอย่างน้อย 10 ตัวอักษร"
  }).refine((val) => !val || val.length <= 200, {
    message: "แนะนำตัวไม่เกิน 200 ตัวอักษร"
  }),
  interests: z.array(z.string()).optional(),
  hobbies: z.string().optional().refine((val) => !val || val.length >= 5, {
    message: "งานอดิเรกอย่างน้อย 5 ตัวอักษร"
  }),
  province: z.string().optional(),
  school: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
}).refine((data) => {
  // ถ้ามีการเปลี่ยนรหัสผ่าน ต้องกรอก currentPassword และ newPassword
  if (data.newPassword && data.newPassword.length > 0) {
    if (!data.currentPassword || data.currentPassword.length < 1) {
      return false;
    }
    if (data.newPassword.length < 6) {
      return false;
    }
    return data.newPassword === data.confirmNewPassword;
  }
  return true;
}, {
  message: "กรุณากรอกรหัสผ่านปัจจุบัน และรหัสผ่านใหม่ต้องตรงกันและมีอย่างน้อย 6 ตัวอักษร",
  path: ["confirmNewPassword"],
});

export const profileSetupSchema = z.object({
  bio: z.string().min(10, "แนะนำตัวอย่างน้อย 10 ตัวอักษร").max(200, "แนะนำตัวไม่เกิน 200 ตัวอักษร"),
  interests: z.array(z.string()).min(1, "เลือกความชอบอย่างน้อย 1 อย่าง"),
  hobbies: z.string().min(5, "งานอดิเรกอย่างน้อย 5 ตัวอักษร"),
  profileImage: z.string().min(1, "กรุณาเพิ่มรูปภาพ"),
  province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  school: z.string().min(1, "กรุณาใส่ชื่อโรงเรียน"),
});

export const schoolSearchSchema = z.object({
  query: z.string().min(1, "กรุณาใส่ชื่อโรงเรียน"),
  province: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ProfileSetupData = z.infer<typeof profileSetupSchema>;
export type SettingsData = z.infer<typeof settingsSchema>;
export type SchoolSearchData = z.infer<typeof schoolSearchSchema>;
export type Match = typeof matches.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type School = typeof schools.$inferSelect;
