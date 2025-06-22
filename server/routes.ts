import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db"; // หรือ path ที่ถูกต้องของไฟล์ db ของคุณ
import { insertUserSchema, loginSchema, profileSetupSchema, schoolSearchSchema, settingsSchema, type User } from "@shared/schema";
import jwt from "jsonwebtoken";
import { setupWebSocket, broadcastToMatch } from "./websocket"; // ✅ Import WebSocket functions
import { checkPassword, hashPassword } from "./utils/auth";

const JWT_SECRET = process.env.JWT_SECRET || "Imissmaysamakmak";

interface AuthRequest extends Request {
  user?: User;
}

function authenticateToken(req: AuthRequest, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'ไม่พบ token' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Token ไม่ถูกต้อง' });
    }

    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // ✅ Setup WebSocket server (ใช้ httpServer เดิม)
  setupWebSocket(httpServer);

  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if nickname already exists
      const existingUser = await storage.getUserByNickname(validatedData.nickname);
      if (existingUser) {
        return res.status(400).json({ message: "ชื่อเล่นนี้ถูกใช้แล้ว" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Handle Instagram username
      let instagram = validatedData.instagram;
      if (instagram && !instagram.startsWith('@')) {
        instagram = `@${instagram}`;
      }

      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        instagram,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({ 
        token, 
        user: userWithoutPassword 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByNickname(validatedData.nickname);
      if (!user) {
        return res.status(401).json({ message: "ชื่อเล่นหรือรหัสผ่านไม่ถูกต้อง" });
      }

      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "ชื่อเล่นหรือรหัสผ่านไม่ถูกต้อง" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json({ 
        token, 
        user: userWithoutPassword 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
    }
  });

  app.get("/api/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      // ดึงข้อมูลผู้ใช้ล่าสุดจากฐานข้อมูล
      const latestUser = await storage.getUser(req.user.id);
      if (!latestUser) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      const { password, ...userWithoutPassword } = latestUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" });
    }
  });

  // Profile setup endpoint
  app.post("/api/profile-setup", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      const validatedData = profileSetupSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserProfile(req.user.id, validatedData);
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "เกิดข้อผิดพลาดในการอัพเดตโปรไฟล์" });
    }
  });

  // Update user profile endpoint
  app.put("/api/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user.id;

      // validate ข้อมูลก่อน
      const validatedData = settingsSchema.parse(req.body);

      const {
        nickname, age, instagram, bio, interests, hobbies,
        profileImage, province, school, newPassword, currentPassword
      } = validatedData;

      const updateData: any = {
        nickname,
        age,
        instagram,
        bio,
        interests: Array.isArray(interests) ? interests : [],
        hobbies,
        profile_image: profileImage,
        province,
        school,
        updated_at: new Date(),
      };

      // ถ้ามีการเปลี่ยนรหัสผ่าน
      if (newPassword && newPassword.length > 0) {
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user || !checkPassword(currentPassword, user[0].password)) {
          return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
        }
        updateData.password = hashPassword(newPassword);
      }

      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      await db.update(users).set(updateData).where(eq(users.id, userId));
      res.json({ message: "อัปเดตข้อมูลสำเร็จ" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "เกิดข้อผิดพลาด" });
    }
  });

  // Get potential matches (exclude current user and already matched users)
  app.get("/api/potential-matches", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const potentialMatches = await storage.getPotentialMatches(req.user.id, limit);
      
      // Remove password from response
      const sanitizedMatches = potentialMatches.map(({ password, ...user }) => user);
      res.json(sanitizedMatches);
    } catch (error: any) {
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการค้นหาเพื่อน" });
    }
  });

  // Create a match (like someone)
  app.post("/api/match", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      const { targetUserId } = req.body;
      
      // Check if match already exists
      const existingMatch = await storage.checkMatch(req.user.id, targetUserId);
      if (existingMatch) {
        return res.status(400).json({ message: "แมทช์นี้มีอยู่แล้ว" });
      }

      const match = await storage.createMatch(req.user.id, targetUserId);
      
      // Return matchId สำหรับใช้สร้าง message แรก
      res.json({ 
        ...match, 
        matchId: match.id 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "เกิดข้อผิดพลาดในการสร้างแมทช์" });
    }
  });

  // ✅ Update matches API to include unread count
  app.get("/api/matches", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      const includeUnread = req.query.include_unread === 'true';
      const matches = await storage.getMatches(req.user.id, includeUnread);
      res.json(matches);
    } catch (error: any) {
      console.error("Error in /api/matches:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล Matches" });
    }
  });

  // Mark messages as read API
  app.patch("/api/messages/:matchId/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      const matchId = parseInt(req.params.matchId);
      
      // ตรวจสอบสิทธิ์
      const userMatches = await storage.getMatches(req.user.id);
      const validMatch = userMatches.find(match => match.id === matchId);
      
      if (!validMatch) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง match นี้" });
      }
      
      await storage.markMessagesAsRead(matchId, req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะข้อความ" });
    }
  });

  // Send a message (text or image)
  app.post("/api/messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      const { matchId, content, messageType, imageUrl } = req.body;
      
      // ตรวจสอบว่า matchId มีอยู่จริง และ user เป็น 1 ใน 2 ฝั่งของ match
      const userMatches = await storage.getMatches(req.user.id);
      const validMatch = userMatches.find(match => match.id === matchId);
      
      if (!validMatch) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์ส่งข้อความใน match นี้" });
      }
      
      const message = await storage.createMessage(
        matchId, 
        req.user.id, 
        content,
        messageType || "text",
        imageUrl
      );
      
      // ✅ Broadcast message to other users in the match via WebSocket
      broadcastToMatch(matchId, {
        type: 'new_message',
        message: message
      }, req.user.id);
      
      res.json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: error.message || "เกิดข้อผิดพลาดในการส่งข้อความ" });
    }
  });

  // Delete all chat messages for a user
  app.delete("/api/messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      await storage.deleteAllUserMessages(req.user.id);
      res.json({ message: "ลบข้อความทั้งหมดสำเร็จ" });
    } catch (error: any) {
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อความ" });
    }
  });

  // Get messages for a match
  app.get("/api/messages/:matchId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      const matchId = parseInt(req.params.matchId);
      
      // ตรวจสอบว่า user มีสิทธิ์เข้าถึง match นี้หรือไม่
      const userMatches = await storage.getMatches(req.user.id);
      const validMatch = userMatches.find(match => match.id === matchId);
      
      if (!validMatch) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อความใน match นี้" });
      }
      
      const messages = await storage.getMessages(matchId);
      res.json(messages);
    } catch (error: any) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อความ" });
    }
  });

  // เพิ่ม API สำหรับลบ match และ messages ที่เกี่ยวข้อง
  app.delete("/api/matches/:matchId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      const matchId = parseInt(req.params.matchId);
      
      // ตรวจสอบว่า user มีสิทธิ์ลบ match นี้หรือไม่
      const userMatches = await storage.getMatches(req.user.id);
      const validMatch = userMatches.find(match => match.id === matchId);
      
      if (!validMatch) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์ลบ match นี้" });
      }
      
      // ลบ messages ก่อน แล้วค่อยลบ match
      await storage.deleteMessages(matchId);
      await storage.deleteMatch(matchId);
      
      res.json({ message: "ลบ match และข้อความสำเร็จ" });
    } catch (error: any) {
      console.error("Error deleting match:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบ match" });
    }
  });

  // แก้ไข Delete chat messages ให้ตรวจสอบสิทธิ์
  app.delete("/api/messages/:matchId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      const matchId = parseInt(req.params.matchId);
      
      // ตรวจสอบว่า user มีสิทธิ์ลบข้อความใน match นี้หรือไม่
      const userMatches = await storage.getMatches(req.user.id);
      const validMatch = userMatches.find(match => match.id === matchId);
      
      if (!validMatch) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์ลบข้อความใน match นี้" });
      }
      
      await storage.deleteMessages(matchId);
      res.json({ message: "ลบข้อความสำเร็จ" });
    } catch (error: any) {
      console.error("Error deleting messages:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อความ" });
    }
  });

  // School search endpoint
  app.post("/api/schools/search", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
      
      const validatedData = schoolSearchSchema.parse(req.body);
      const schools = await storage.searchSchools(validatedData.query, validatedData.province);
      res.json(schools);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "เกิดข้อผิดพลาดในการค้นหาโรงเรียน" });
    }
  });

  // Test endpoint to create a match between users 1 and 2
  app.post("/api/test/create-match", async (req, res) => {
    try {
      // Check if match already exists
      const existingMatch = await storage.checkMatch(1, 2);
      if (existingMatch) {
        return res.json({ message: "Match already exists", match: existingMatch });
      }

      // Create new match
      const match = await storage.createMatch(1, 2);
      res.json({ message: "Match created successfully", match });
    } catch (error: any) {
      console.error("Error creating test match:", error);
      res.status(500).json({ message: "Failed to create match", error: error.message });
    }
  });

  return httpServer;
}
