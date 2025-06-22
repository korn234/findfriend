var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import path3 from "path";
import { fileURLToPath } from "url";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  matches: () => matches,
  messages: () => messages,
  profileSetupSchema: () => profileSetupSchema,
  registerSchema: () => registerSchema,
  schoolSearchSchema: () => schoolSearchSchema,
  schools: () => schools,
  settingsSchema: () => settingsSchema,
  users: () => users2
});
import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users2 = pgTable("users", {
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
  updatedAt: timestamp("updated_at").defaultNow()
});
var schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  province: text("province").notNull(),
  address: text("address"),
  googlePlaceId: text("google_place_id"),
  createdAt: timestamp("created_at").defaultNow()
});
var matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  userId1: integer("user_id_1").notNull().references(() => users2.id),
  userId2: integer("user_id_2").notNull().references(() => users2.id),
  status: text("status").notNull().default("pending"),
  // pending, matched, blocked
  createdAt: timestamp("created_at").defaultNow()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  senderId: integer("sender_id").notNull().references(() => users2.id),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"),
  // text, image
  imageUrl: text("image_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users2).omit({
  id: true
});
var loginSchema = z.object({
  nickname: z.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E48\u0E19"),
  password: z.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19")
});
var registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 6 \u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23")
}).refine((data) => data.password === data.confirmPassword, {
  message: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19",
  path: ["confirmPassword"]
});
var settingsSchema = z.object({
  profileImage: z.string().optional(),
  nickname: z.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E48\u0E19"),
  age: z.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E0A\u0E48\u0E27\u0E07\u0E2D\u0E32\u0E22\u0E38"),
  instagram: z.string().optional(),
  bio: z.string().optional().refine((val) => !val || val.length >= 10, {
    message: "\u0E41\u0E19\u0E30\u0E19\u0E33\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 10 \u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23"
  }).refine((val) => !val || val.length <= 200, {
    message: "\u0E41\u0E19\u0E30\u0E19\u0E33\u0E15\u0E31\u0E27\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 200 \u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23"
  }),
  interests: z.array(z.string()).optional(),
  hobbies: z.string().optional().refine((val) => !val || val.length >= 5, {
    message: "\u0E07\u0E32\u0E19\u0E2D\u0E14\u0E34\u0E40\u0E23\u0E01\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 5 \u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23"
  }),
  province: z.string().optional(),
  school: z.string().optional(),
  currentPassword: z.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19"),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional()
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0) {
    if (data.newPassword.length < 6) {
      return false;
    }
    return data.newPassword === data.confirmNewPassword;
  }
  return true;
}, {
  message: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E31\u0E49\u0E19\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B (\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 6 \u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23)",
  path: ["confirmNewPassword"]
});
var profileSetupSchema = z.object({
  bio: z.string().min(10, "\u0E41\u0E19\u0E30\u0E19\u0E33\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 10 \u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23").max(200, "\u0E41\u0E19\u0E30\u0E19\u0E33\u0E15\u0E31\u0E27\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 200 \u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23"),
  interests: z.array(z.string()).min(1, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E04\u0E27\u0E32\u0E21\u0E0A\u0E2D\u0E1A\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E2D\u0E22\u0E48\u0E32\u0E07"),
  hobbies: z.string().min(5, "\u0E07\u0E32\u0E19\u0E2D\u0E14\u0E34\u0E40\u0E23\u0E01\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 5 \u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23"),
  profileImage: z.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E"),
  province: z.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14"),
  school: z.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E0A\u0E37\u0E48\u0E2D\u0E42\u0E23\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19")
});
var schoolSearchSchema = z.object({
  query: z.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E0A\u0E37\u0E48\u0E2D\u0E42\u0E23\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19"),
  province: z.string().optional()
});

// server/db.ts
import * as dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
dotenv.config();
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db2 = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq as eq2, and, or, ilike, ne, sql } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db2.select().from(users2).where(eq2(users2.id, id));
    return user || void 0;
  }
  async getUserByNickname(nickname) {
    const [user] = await db2.select().from(users2).where(eq2(users2.nickname, nickname));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db2.insert(users2).values({
      ...insertUser,
      instagram: insertUser.instagram || null
    }).returning();
    return user;
  }
  async updateUserProfile(userId, profileData) {
    const [user] = await db2.update(users2).set({
      ...profileData,
      profileCompleted: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(users2.id, userId)).returning();
    return user;
  }
  async updateUserSettings(userId, settingsData) {
    const updateData = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (settingsData.profileImage !== void 0) {
      updateData.profileImage = settingsData.profileImage;
    }
    if (settingsData.nickname) {
      updateData.nickname = settingsData.nickname;
    }
    if (settingsData.age) {
      updateData.age = settingsData.age;
    }
    if (settingsData.instagram !== void 0) {
      let instagram = settingsData.instagram;
      if (instagram && !instagram.startsWith("@")) {
        instagram = `@${instagram}`;
      }
      updateData.instagram = instagram;
    }
    if (settingsData.bio !== void 0) {
      updateData.bio = settingsData.bio;
    }
    if (settingsData.interests !== void 0) {
      updateData.interests = settingsData.interests;
    }
    if (settingsData.hobbies !== void 0) {
      updateData.hobbies = settingsData.hobbies;
    }
    if (settingsData.province !== void 0) {
      updateData.province = settingsData.province;
    }
    if (settingsData.school !== void 0) {
      updateData.school = settingsData.school;
    }
    if (settingsData.password) {
      updateData.password = settingsData.password;
    }
    const [user] = await db2.update(users2).set(updateData).where(eq2(users2.id, userId)).returning();
    return user;
  }
  async getPotentialMatches(userId, limit = 10) {
    const currentUser = await this.getUser(userId);
    if (!currentUser) return [];
    const matchedUserIds = await db2.select({ userId: sql`CASE WHEN ${matches.userId1} = ${userId} THEN ${matches.userId2} ELSE ${matches.userId1} END` }).from(matches).where(or(eq2(matches.userId1, userId), eq2(matches.userId2, userId)));
    const excludeIds = [userId, ...matchedUserIds.map((m) => m.userId)];
    const excludeClause = excludeIds.length > 0 ? sql`${users2.id} NOT IN (${sql.raw(excludeIds.join(","))})` : sql`1=1`;
    return await db2.select().from(users2).where(
      and(
        excludeClause,
        eq2(users2.profileCompleted, true),
        eq2(users2.isActive, true)
      )
    ).limit(limit).orderBy(sql`RANDOM()`);
  }
  // School operations
  async searchSchools(query, province) {
    const conditions = [ilike(schools.name, `%${query}%`)];
    if (province) {
      conditions.push(eq2(schools.province, province));
    }
    return await db2.select().from(schools).where(and(...conditions)).limit(20);
  }
  async createSchool(name, province, address, googlePlaceId) {
    const [school] = await db2.insert(schools).values({
      name,
      province,
      address,
      googlePlaceId
    }).returning();
    return school;
  }
  // Match operations
  async createMatch(userId1, userId2) {
    const [match] = await db2.insert(matches).values({
      userId1,
      userId2,
      status: "matched"
    }).returning();
    return match;
  }
  async getMatches(userId, includeUnread = false) {
    try {
      const result = await db2.execute(
        sql`
          WITH LastMessages AS (
            SELECT DISTINCT ON (match_id)
              match_id,
              content,
              sender_id,
              message_type,
              image_url,
              created_at,
              is_read
            FROM messages
            ORDER BY match_id, created_at DESC
          ),
          UnreadCounts AS (
            SELECT match_id, COUNT(*) as unread_count
            FROM messages
            WHERE is_read = false AND sender_id != ${userId}
            GROUP BY match_id
          )
          SELECT
            m.id,
            m.created_at,
            m.status,
            m.user_id_1,
            m.user_id_2,
            CASE WHEN m.user_id_1 = ${userId} THEN m.user_id_2 ELSE m.user_id_1 END AS other_user_id,
            CASE WHEN m.user_id_1 = ${userId} THEN u2.nickname ELSE u1.nickname END AS nickname,
            CASE WHEN m.user_id_1 = ${userId} THEN u2.profile_image ELSE u1.profile_image END AS profile_image,
            CASE WHEN m.user_id_1 = ${userId} THEN u2.instagram ELSE u1.instagram END AS instagram,
            CASE WHEN m.user_id_1 = ${userId} THEN u2.is_active ELSE u1.is_active END AS is_active,
            lm.content as last_message_content,
            lm.sender_id as last_message_sender_id,
            lm.message_type as last_message_type,
            lm.image_url as last_message_image_url,
            lm.created_at as last_message_created_at,
            lm.is_read as last_message_is_read,
            COALESCE(uc.unread_count, 0) as unread_count
          FROM matches m
          LEFT JOIN users u1 ON m.user_id_1 = u1.id
          LEFT JOIN users u2 ON m.user_id_2 = u2.id
          LEFT JOIN LastMessages lm ON m.id = lm.match_id
          LEFT JOIN UnreadCounts uc ON m.id = uc.match_id
          WHERE m.user_id_1 = ${userId} OR m.user_id_2 = ${userId}
          ORDER BY COALESCE(lm.created_at, m.created_at) DESC
        `
      );
      return result.rows.map((row) => ({
        id: row.id,
        userId1: row.user_id_1,
        userId2: row.user_id_2,
        createdAt: row.created_at,
        status: row.status,
        otherUser: {
          id: row.other_user_id,
          nickname: row.nickname,
          age: "",
          // Required by User type
          instagram: row.instagram,
          password: "",
          // Required by User type
          bio: null,
          interests: null,
          hobbies: null,
          profileImage: row.profile_image,
          province: null,
          school: null,
          profileCompleted: true,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: null
        },
        lastMessage: row.last_message_content ? {
          id: 0,
          matchId: row.id,
          content: row.last_message_content,
          senderId: row.last_message_sender_id,
          messageType: row.last_message_type || "text",
          imageUrl: row.last_message_image_url,
          createdAt: row.last_message_created_at,
          isRead: row.last_message_is_read || false
        } : void 0,
        unreadCount: parseInt(row.unread_count)
      }));
    } catch (error) {
      console.error("getMatches error:", error);
      throw error;
    }
  }
  async checkMatch(userId1, userId2) {
    const [match] = await db2.select().from(matches).where(
      or(
        and(eq2(matches.userId1, userId1), eq2(matches.userId2, userId2)),
        and(eq2(matches.userId1, userId2), eq2(matches.userId2, userId1))
      )
    );
    return match || void 0;
  }
  // Helper function to get match by ID
  async getMatchById(matchId) {
    const [match] = await db2.select().from(matches).where(eq2(matches.id, matchId));
    return match || void 0;
  }
  // Message operations
  async createMessage(matchId, senderId, content, messageType = "text", imageUrl) {
    const [message] = await db2.insert(messages).values({
      matchId,
      senderId,
      content,
      messageType,
      imageUrl
    }).returning();
    return message;
  }
  async getMessages(matchId) {
    return await db2.select().from(messages).where(eq2(messages.matchId, matchId)).orderBy(messages.createdAt);
  }
  async markMessagesAsRead(matchId, userId) {
    await db2.update(messages).set({ isRead: true }).where(
      and(
        eq2(messages.matchId, matchId),
        ne(messages.senderId, userId),
        // ไม่อัปเดตข้อความของตัวเอง
        eq2(messages.isRead, false)
      )
    );
  }
  async deleteMessages(matchId) {
    await db2.delete(messages).where(eq2(messages.matchId, matchId));
  }
  async deleteAllUserMessages(userId) {
    const userMatches = await db2.select({ id: matches.id }).from(matches).where(
      or(eq2(matches.userId1, userId), eq2(matches.userId2, userId))
    );
    await Promise.all(userMatches.map((match) => this.deleteMessages(match.id)));
  }
  async deleteMatch(matchId) {
    await db2.delete(matches).where(eq2(matches.id, matchId));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import jwt2 from "jsonwebtoken";
import bcrypt from "bcrypt";

// server/websocket.ts
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "Imissmaysamakmak";
var wsConnections = /* @__PURE__ */ new Map();
function addConnection(userId, ws2) {
  if (!wsConnections.has(userId)) {
    wsConnections.set(userId, []);
  }
  wsConnections.get(userId).push(ws2);
}
function removeConnection(userId, ws2) {
  const connections = wsConnections.get(userId);
  if (connections) {
    const index = connections.indexOf(ws2);
    if (index > -1) {
      connections.splice(index, 1);
    }
    if (connections.length === 0) {
      wsConnections.delete(userId);
    }
  }
}
async function broadcastToMatch(matchId, message, excludeUserId) {
  try {
    const allMatches = await storage.getMatches(excludeUserId || 0);
    const match = allMatches.find((m) => m.id === matchId);
    if (match) {
      [match.userId1, match.userId2].forEach((uid) => {
        if (uid !== excludeUserId) {
          const connections = wsConnections.get(uid);
          if (connections) {
            connections.forEach((ws2) => {
              if (ws2.readyState === WebSocket.OPEN) {
                ws2.send(JSON.stringify(message));
              }
            });
          }
        }
      });
    }
  } catch (error) {
    console.error("Error broadcasting to match:", error);
  }
}
function setupWebSocket(httpServer) {
  console.log("Setting up WebSocket server...");
  const wss = new WebSocketServer({
    server: httpServer,
    perMessageDeflate: false,
    maxPayload: 16 * 1024 * 1024,
    // 16MB
    clientTracking: true,
    handleProtocols: (protocols, request) => {
      return protocols.size > 0 ? Array.from(protocols)[0] : false;
    },
    // Enable secure WebSocket in production
    path: "/ws",
    verifyClient: (info, callback) => {
      if (process.env.NODE_ENV !== "production") {
        callback(true);
        return;
      }
      const origin = info.origin || info.req.headers.origin;
      const allowedOrigins = [
        process.env.CLIENT_URL || "https://your-app-name.onrender.com",
        "http://localhost:5173"
      ];
      if (allowedOrigins.includes(origin)) {
        callback(true);
      } else {
        callback(false, 403, "Forbidden");
      }
    }
  });
  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });
  wss.on("connection", (ws2, req) => {
    console.log("New WebSocket connection from:", req.socket.remoteAddress);
    let userId = null;
    let pingInterval = null;
    ws2.on("error", (error) => {
      console.error("WebSocket connection error:", error);
      if (userId) {
        removeConnection(userId, ws2);
      }
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      try {
        ws2.terminate();
      } catch (e) {
      }
    });
    ws2.on("close", (code, reason) => {
      console.log(`WebSocket closed: ${code} ${reason.toString()}`);
      if (userId) {
        removeConnection(userId, ws2);
      }
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    });
    ws2.on("pong", () => {
    });
    pingInterval = setInterval(() => {
      if (ws2.readyState === WebSocket.OPEN) {
        try {
          ws2.ping();
        } catch (error) {
          console.error("Error sending ping:", error);
          if (pingInterval) {
            clearInterval(pingInterval);
          }
        }
      } else {
        if (pingInterval) {
          clearInterval(pingInterval);
        }
      }
    }, 3e4);
    ws2.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log("WebSocket message received:", message.type);
        if (message.type === "auth") {
          const token = message.token;
          if (token) {
            jwt.verify(token, JWT_SECRET, async (err, decoded) => {
              if (!err && decoded) {
                try {
                  const user = await storage.getUser(decoded.userId);
                  if (user) {
                    userId = user.id;
                    addConnection(userId, ws2);
                    console.log(`WebSocket authenticated for user ${userId}`);
                    ws2.send(JSON.stringify({ type: "auth_success", userId }));
                  } else {
                    console.log("WebSocket auth failed: user not found");
                    ws2.send(JSON.stringify({ type: "auth_error", message: "User not found" }));
                  }
                } catch (dbError) {
                  console.error("Database error during WebSocket auth:", dbError);
                  ws2.send(JSON.stringify({ type: "auth_error", message: "Database error" }));
                }
              } else {
                console.log("WebSocket auth failed: invalid token", err?.message);
                ws2.send(JSON.stringify({ type: "auth_error", message: "Invalid token" }));
              }
            });
          } else {
            console.log("WebSocket auth failed: no token provided");
            ws2.send(JSON.stringify({ type: "auth_error", message: "No token provided" }));
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        try {
          ws2.send(JSON.stringify({ type: "error", message: "Message processing error" }));
        } catch (sendError) {
          console.error("Error sending error message:", sendError);
        }
      }
    });
  });
  console.log("WebSocket server ready");
  return wss;
}

// server/routes.ts
var JWT_SECRET2 = process.env.JWT_SECRET || "Imissmaysamakmak";
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A token" });
  }
  jwt2.verify(token, JWT_SECRET2, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07" });
    }
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
    }
    req.user = user;
    next();
  });
}
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  setupWebSocket(httpServer);
  app2.post("/api/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByNickname(validatedData.nickname);
      if (existingUser) {
        return res.status(400).json({ message: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E48\u0E19\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27" });
      }
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      let instagram = validatedData.instagram;
      if (instagram && !instagram.startsWith("@")) {
        instagram = `@${instagram}`;
      }
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        instagram
      });
      const token = jwt2.sign({ userId: user.id }, JWT_SECRET2, { expiresIn: "7d" });
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(400).json({ message: error.message || "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01" });
    }
  });
  app2.post("/api/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByNickname(validatedData.nickname);
      if (!user) {
        return res.status(401).json({ message: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E48\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07" });
      }
      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E48\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07" });
      }
      const token = jwt2.sign({ userId: user.id }, JWT_SECRET2, { expiresIn: "7d" });
      const { password, ...userWithoutPassword } = user;
      res.json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(400).json({ message: error.message || "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A" });
    }
  });
  app2.get("/api/me", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const latestUser = await storage.getUser(req.user.id);
      if (!latestUser) {
        return res.status(404).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const { password, ...userWithoutPassword } = latestUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
    }
  });
  app2.post("/api/profile-setup", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const validatedData = profileSetupSchema.parse(req.body);
      const updatedUser = await storage.updateUserProfile(req.user.id, validatedData);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error.message || "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E1E\u0E40\u0E14\u0E15\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C" });
    }
  });
  app2.put("/api/me", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        nickname,
        age,
        instagram,
        bio,
        interests,
        hobbies,
        profileImage,
        province,
        school,
        newPassword,
        currentPassword
      } = req.body;
      const updateData = {
        nickname,
        age,
        instagram,
        bio,
        interests,
        hobbies,
        profile_image: profileImage,
        province,
        school,
        updated_at: /* @__PURE__ */ new Date()
      };
      if (newPassword && newPassword.length > 0) {
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user || !checkPassword(currentPassword, user[0].password)) {
          return res.status(400).json({ message: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07" });
        }
        updateData.password = hashPassword(newPassword);
      }
      Object.keys(updateData).forEach(
        (key) => updateData[key] === void 0 && delete updateData[key]
      );
      await db.update(users).set(updateData).where(eq(users.id, userId));
      res.json({ message: "\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08" });
    } catch (error) {
      res.status(400).json({ message: error.message || "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14" });
    }
  });
  app2.get("/api/potential-matches", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const limit = parseInt(req.query.limit) || 10;
      const potentialMatches = await storage.getPotentialMatches(req.user.id, limit);
      const sanitizedMatches = potentialMatches.map(({ password, ...user }) => user);
      res.json(sanitizedMatches);
    } catch (error) {
      res.status(500).json({ message: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E19" });
    }
  });
  app2.post("/api/match", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const { targetUserId } = req.body;
      const existingMatch = await storage.checkMatch(req.user.id, targetUserId);
      if (existingMatch) {
        return res.status(400).json({ message: "\u0E41\u0E21\u0E17\u0E0A\u0E4C\u0E19\u0E35\u0E49\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27" });
      }
      const match = await storage.createMatch(req.user.id, targetUserId);
      res.json({
        ...match,
        matchId: match.id
      });
    } catch (error) {
      res.status(400).json({ message: error.message || "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E41\u0E21\u0E17\u0E0A\u0E4C" });
    }
  });
  app2.get("/api/matches", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const includeUnread = req.query.include_unread === "true";
      const matches2 = await storage.getMatches(req.user.id, includeUnread);
      res.json(matches2);
    } catch (error) {
      console.error("Error in /api/matches:", error);
      res.status(500).json({ message: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 Matches" });
    }
  });
  app2.patch("/api/messages/:matchId/read", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const matchId = parseInt(req.params.matchId);
      const userMatches = await storage.getMatches(req.user.id);
      const validMatch = userMatches.find((match) => match.id === matchId);
      if (!validMatch) {
        return res.status(403).json({ message: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07 match \u0E19\u0E35\u0E49" });
      }
      await storage.markMessagesAsRead(matchId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21" });
    }
  });
  app2.post("/api/messages", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const { matchId, content, messageType, imageUrl } = req.body;
      const userMatches = await storage.getMatches(req.user.id);
      const validMatch = userMatches.find((match) => match.id === matchId);
      if (!validMatch) {
        return res.status(403).json({ message: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2A\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E43\u0E19 match \u0E19\u0E35\u0E49" });
      }
      const message = await storage.createMessage(
        matchId,
        req.user.id,
        content,
        messageType || "text",
        imageUrl
      );
      broadcastToMatch(matchId, {
        type: "new_message",
        message
      }, req.user.id);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: error.message || "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21" });
    }
  });
  app2.delete("/api/messages", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      await storage.deleteAllUserMessages(req.user.id);
      res.json({ message: "\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08" });
    } catch (error) {
      res.status(500).json({ message: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21" });
    }
  });
  app2.get("/api/messages/:matchId", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const matchId = parseInt(req.params.matchId);
      const userMatches = await storage.getMatches(req.user.id);
      const validMatch = userMatches.find((match) => match.id === matchId);
      if (!validMatch) {
        return res.status(403).json({ message: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E43\u0E19 match \u0E19\u0E35\u0E49" });
      }
      const messages2 = await storage.getMessages(matchId);
      res.json(messages2);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21" });
    }
  });
  app2.delete("/api/matches/:matchId", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const matchId = parseInt(req.params.matchId);
      const userMatches = await storage.getMatches(req.user.id);
      const validMatch = userMatches.find((match) => match.id === matchId);
      if (!validMatch) {
        return res.status(403).json({ message: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E25\u0E1A match \u0E19\u0E35\u0E49" });
      }
      await storage.deleteMessages(matchId);
      await storage.deleteMatch(matchId);
      res.json({ message: "\u0E25\u0E1A match \u0E41\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08" });
    } catch (error) {
      console.error("Error deleting match:", error);
      res.status(500).json({ message: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E1A match" });
    }
  });
  app2.delete("/api/messages/:matchId", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const matchId = parseInt(req.params.matchId);
      const userMatches = await storage.getMatches(req.user.id);
      const validMatch = userMatches.find((match) => match.id === matchId);
      if (!validMatch) {
        return res.status(403).json({ message: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E43\u0E19 match \u0E19\u0E35\u0E49" });
      }
      await storage.deleteMessages(matchId);
      res.json({ message: "\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08" });
    } catch (error) {
      console.error("Error deleting messages:", error);
      res.status(500).json({ message: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21" });
    }
  });
  app2.post("/api/schools/search", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" });
      }
      const validatedData = schoolSearchSchema.parse(req.body);
      const schools2 = await storage.searchSchools(validatedData.query, validatedData.province);
      res.json(schools2);
    } catch (error) {
      res.status(400).json({ message: error.message || "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E42\u0E23\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19" });
    }
  });
  app2.post("/api/test/create-match", async (req, res) => {
    try {
      const existingMatch = await storage.checkMatch(1, 2);
      if (existingMatch) {
        return res.json({ message: "Match already exists", match: existingMatch });
      }
      const match = await storage.createMatch(1, 2);
      res.json({ message: "Match created successfully", match });
    } catch (error) {
      console.error("Error creating test match:", error);
      res.status(500).json({ message: "Failed to create match", error: error.message });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { compression } from "vite-plugin-compression2";
var vite_config_default = defineConfig({
  plugins: [
    react({
      // Optimize JSX runtime
      jsxRuntime: "automatic",
      babel: {
        plugins: [
          // Optimize styled-components
          ["babel-plugin-styled-components", { displayName: false, pure: true }]
        ]
      }
    }),
    // runtimeErrorOverlay(), // Temporarily disabled
    // Add compression for production builds
    compression({
      algorithms: ["brotli"],
      exclude: [/\.(br)$/, /\.(gz)$/, /\.(png|jpe?g|gif|webp)$/i],
      deleteOriginalAssets: false
    }),
    // Add build visualization in production
    process.env.NODE_ENV === "production" && visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true
    }),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Enhanced build performance
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    // Improved code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "react-vendor";
            if (id.includes("@radix-ui")) return "ui-vendor";
            if (id.includes("@tanstack/react-query")) return "query-vendor";
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod"))
              return "form-vendor";
            if (id.includes("lucide-react")) return "icons-vendor";
            return "vendor";
          }
          if (id.includes("/components/tabs/")) return "features";
          if (id.includes("/components/ui/")) return "ui";
        },
        // Optimize chunk file names and add content hash
        chunkFileNames: "assets/[name].[hash].js",
        entryFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]"
      }
    },
    // Increase chunk size limit
    chunkSizeWarningLimit: 1500,
    // Enable asset optimization
    assetsInlineLimit: 4096,
    // 4kb
    cssCodeSplit: true,
    cssMinify: true,
    // Enable module preload
    modulePreload: {
      polyfill: true
    }
  },
  server: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    hmr: {
      port: process.env.PORT ? parseInt(process.env.PORT) : 24678,
      clientPort: process.env.PORT ? parseInt(process.env.PORT) : 24678
    },
    proxy: {
      "/api": {
        target: process.env.API_URL || "http://localhost:5000",
        changeOrigin: true,
        secure: true
      },
      "/ws": {
        target: process.env.WS_URL || "ws://localhost:5000",
        ws: true,
        changeOrigin: true
      }
    }
  },
  // Enhanced dependency optimization
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "react-hook-form",
      "zod",
      "clsx",
      "tailwind-merge",
      "wouter",
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select"
    ],
    exclude: ["@replit/vite-plugin-cartographer"],
    esbuildOptions: {
      target: "esnext"
    }
  },
  // Enhanced esbuild optimizations
  esbuild: {
    target: "esnext",
    platform: "browser",
    format: "esm",
    treeShaking: true,
    // Remove console.log and debugger in production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    // Minification options
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: {
      server,
      port: 24678,
      timeout: 12e4,
      overlay: false
    }
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
var app = express2();
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ limit: "10mb", extended: true }));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  app.use(express2.static(path3.join(__dirname, "../client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path3.join(__dirname, "../client/dist/index.html"));
  });
  const port = process.env.PORT || 5e3;
  server.listen({
    port: parseInt(port.toString()),
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
