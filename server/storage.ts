import { users, matches, messages, schools, type User, type InsertUser, type Match, type Message, type ProfileSetupData, type SettingsData, type School } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, ilike, ne, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByNickname(nickname: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: number, profileData: Partial<ProfileSetupData>): Promise<User>;
  updateUserSettings(userId: number, settingsData: Partial<SettingsData>): Promise<User>;
  getPotentialMatches(userId: number, limit?: number): Promise<User[]>;
  
  // School operations
  searchSchools(query: string, province?: string): Promise<School[]>;
  createSchool(name: string, province: string, address?: string, googlePlaceId?: string): Promise<School>;
  
  // Match operations
  createMatch(userId1: number, userId2: number): Promise<Match>;
  getMatches(userId: number, includeUnread?: boolean): Promise<Array<Match & { otherUser: User; lastMessage?: Message }>>;
  checkMatch(userId1: number, userId2: number): Promise<Match | undefined>;
  
  // Message operations
  createMessage(matchId: number, senderId: number, content: string, messageType?: string, imageUrl?: string): Promise<Message>;
  getMessages(matchId: number): Promise<Message[]>;
  markMessagesAsRead(matchId: number, userId: number): Promise<void>;
  deleteMessages(matchId: number): Promise<void>;
  deleteAllUserMessages(userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByNickname(nickname: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.nickname, nickname));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        instagram: insertUser.instagram || null
      })
      .returning();
    return user;
  }

  async updateUserProfile(userId: number, profileData: Partial<ProfileSetupData>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profileData,
        profileCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSettings(userId: number, settingsData: Partial<SettingsData> & { password?: string }): Promise<User> {
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (settingsData.profileImage !== undefined) {
      updateData.profileImage = settingsData.profileImage;
    }
    if (settingsData.nickname) {
      updateData.nickname = settingsData.nickname;
    }
    if (settingsData.age) {
      updateData.age = settingsData.age;
    }
    if (settingsData.instagram !== undefined) {
      // Handle Instagram username
      let instagram = settingsData.instagram;
      if (instagram && !instagram.startsWith('@')) {
        instagram = `@${instagram}`;
      }
      updateData.instagram = instagram;
    }
    if (settingsData.bio !== undefined) {
      updateData.bio = settingsData.bio;
    }
    if (settingsData.interests !== undefined) {
      updateData.interests = settingsData.interests;
    }
    if (settingsData.hobbies !== undefined) {
      updateData.hobbies = settingsData.hobbies;
    }
    if (settingsData.province !== undefined) {
      updateData.province = settingsData.province;
    }
    if (settingsData.school !== undefined) {
      updateData.school = settingsData.school;
    }
    if (settingsData.password) {
      updateData.password = settingsData.password;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getPotentialMatches(userId: number, limit: number = 10): Promise<User[]> {
    // Get users who haven't been matched with current user and have completed profiles
    const currentUser = await this.getUser(userId);
    if (!currentUser) return [];

    const matchedUserIds = await db
      .select({ userId: sql<number>`CASE WHEN ${matches.userId1} = ${userId} THEN ${matches.userId2} ELSE ${matches.userId1} END` })
      .from(matches)
      .where(or(eq(matches.userId1, userId), eq(matches.userId2, userId)));

    const excludeIds = [userId, ...matchedUserIds.map(m => m.userId)];
    const excludeClause = excludeIds.length > 0 ? sql`${users.id} NOT IN (${sql.raw(excludeIds.join(','))})` : sql`1=1`;

    return await db
      .select()
      .from(users)
      .where(
        and(
          excludeClause,
          eq(users.profileCompleted, true),
          eq(users.isActive, true)
        )
      )
      .limit(limit)
      .orderBy(sql`RANDOM()`);
  }

  // School operations
  async searchSchools(query: string, province?: string): Promise<School[]> {
    const conditions = [ilike(schools.name, `%${query}%`)];
    if (province) {
      conditions.push(eq(schools.province, province));
    }
    
    return await db
      .select()
      .from(schools)
      .where(and(...conditions))
      .limit(20);
  }

  async createSchool(name: string, province: string, address?: string, googlePlaceId?: string): Promise<School> {
    const [school] = await db
      .insert(schools)
      .values({
        name,
        province,
        address,
        googlePlaceId,
      })
      .returning();
    return school;
  }

  // Match operations
  async createMatch(userId1: number, userId2: number): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values({
        userId1,
        userId2,
        status: "matched"
      })
      .returning();
    
    return match;
  }

  async getMatches(userId: number, includeUnread: boolean = false): Promise<Array<Match & { otherUser: User; lastMessage?: Message; unreadCount?: number }>> {
    try {
      type DBResult = {
        id: number;
        created_at: Date;
        status: string;
        user_id_1: number;
        user_id_2: number;
        other_user_id: number;
        nickname: string;
        profile_image: string | null;
        instagram: string | null;
        is_active: boolean;
        last_message_content: string | null;
        last_message_sender_id: number | null;
        last_message_type: string | null;
        last_message_image_url: string | null;
        last_message_created_at: Date | null;
        last_message_is_read: boolean | null;
        unread_count: string;
      };

      const result = await db.execute<DBResult>(
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

      return result.rows.map(row => ({
        id: row.id,
        userId1: row.user_id_1,
        userId2: row.user_id_2,
        createdAt: row.created_at,
        status: row.status,
        otherUser: {
          id: row.other_user_id,
          nickname: row.nickname,
          age: "", // Required by User type
          instagram: row.instagram,
          password: "", // Required by User type
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
          senderId: row.last_message_sender_id!,
          messageType: row.last_message_type || "text",
          imageUrl: row.last_message_image_url,
          createdAt: row.last_message_created_at!,
          isRead: row.last_message_is_read || false
        } : undefined,
        unreadCount: parseInt(row.unread_count)
      }));
    } catch (error) {
      console.error("getMatches error:", error);
      throw error;
    }
  }

  async checkMatch(userId1: number, userId2: number): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(
        or(
          and(eq(matches.userId1, userId1), eq(matches.userId2, userId2)),
          and(eq(matches.userId1, userId2), eq(matches.userId2, userId1))
        )
      );
    return match || undefined;
  }

  // Helper function to get match by ID
  async getMatchById(matchId: number): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId));
    return match || undefined;
  }

  // Message operations
  async createMessage(matchId: number, senderId: number, content: string, messageType: string = "text", imageUrl?: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        matchId,
        senderId,
        content,
        messageType,
        imageUrl,
      })
      .returning();
    return message;
  }

  async getMessages(matchId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(messages.createdAt); // Changed to ascending order
  }

  async markMessagesAsRead(matchId: number, userId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.matchId, matchId),
          ne(messages.senderId, userId), // ไม่อัปเดตข้อความของตัวเอง
          eq(messages.isRead, false)
        )
      );
  }

  async deleteMessages(matchId: number): Promise<void> {
    await db
      .delete(messages)
      .where(eq(messages.matchId, matchId));
  }

  async deleteAllUserMessages(userId: number): Promise<void> {
    // Get all matches for the user
    const userMatches = await db
      .select({ id: matches.id })
      .from(matches)
      .where(
        or(eq(matches.userId1, userId), eq(matches.userId2, userId))
      );

    // Delete all messages from those matches in parallel
    await Promise.all(userMatches.map(match => this.deleteMessages(match.id)));
  }

  async deleteMatch(matchId: number): Promise<void> {
    await db
      .delete(matches)
      .where(eq(matches.id, matchId));
  }
}

export const storage = new DatabaseStorage();
