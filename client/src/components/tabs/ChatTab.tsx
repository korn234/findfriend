import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { auth } from "@/lib/auth";
import { MessageCircle, Send, Plus, Smile, Camera, Trash2, ExternalLink, Image as ImageIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";

interface Match {
  id: number;
  otherUser: {
    id: number;
    nickname: string;
    profileImage?: string;
    instagram?: string;
    isActive: boolean;
  };
  createdAt: string;
  unreadCount?: number; // ✅ เพิ่ม unread count
  lastMessage?: Message; // ✅ เพิ่ม last message
}

interface Message {
  id: number;
  matchId: number;
  senderId: number;
  content: string;
  messageType: string;
  imageUrl?: string;
  isRead: boolean; // ✅ เพิ่ม read status
  createdAt: string;
}

interface ChatData {
  match: Match;
  messages: Message[];
  lastMessage?: Message;
}

export function ChatTab() {
  const { user } = useAuth() as { user: User | null };
  const queryClient = useQueryClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [messageCache, setMessageCache] = useState<Map<number, Message[]>>(new Map());

  // ✅ ย้าย utility functions ขึ้นมาข้างบน
  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'เมื่อสักครู่';
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ชั่วโมงที่แล้ว`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }, []);

  const openInstagram = useCallback((instagram?: string) => {
    if (instagram) {
      const username = instagram.startsWith('@') ? instagram.slice(1) : instagram;
      window.open(`https://instagram.com/${username}`, '_blank');
    }
  }, []);

  const handleManualScroll = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ✅ Memoize expensive operations
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('auth_token');
  }, []);

  // ✅ Mark messages as read API
  const markMessagesAsRead = useCallback(async (matchId: number) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      await fetch(`/api/messages/${matchId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // ✅ Update unread count locally
      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { ...match, unreadCount: 0 }
          : match
      ));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [getAuthToken]);

  // ✅ Debounced loadMessages
  const loadMessages = useCallback(async (match: Match) => {
    if (loadingMessages || Date.now() - lastRefresh < 2000) { // ลดเป็น 2 วินาที
      return;
    }
    
    // ✅ ตรวจสอบ cache ก่อน
    const cached = messageCache.get(match.id);
    if (cached && cached.length > 0) {
      const chatData: ChatData = {
        match,
        messages: cached,
        lastMessage: cached[cached.length - 1],
      };
      setSelectedChat(chatData);
      return;
    }
    
    setLoadingMessages(true);
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`/api/messages/${match.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const messages = await response.json();
        
        // ✅ Cache messages
        setMessageCache(prev => new Map(prev).set(match.id, messages));
        
        const chatData: ChatData = {
          match,
          messages,
          lastMessage: messages[messages.length - 1],
        };
        
        setSelectedChat(chatData);
        setLastRefresh(Date.now());
        
        // ✅ Mark messages as read
        await markMessagesAsRead(match.id);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [loadingMessages, lastRefresh, messageCache, getAuthToken, markMessagesAsRead]);

  // ✅ Optimized loadMatches
  const loadMatches = useCallback(async () => {
    try {
      !loading && setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        console.warn("No token found");
        return;
      }

      // ✅ เพิ่ม query parameter สำหรับ unread count
      const response = await fetch("/api/matches?include_unread=true", {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.status === 403 || response.status === 401) {
        console.warn("Token expired");
        localStorage.removeItem('token');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      }
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, loading]);

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // ✅ เพิ่ม typing indicators
    if (!isTyping && selectedChat) {
      setIsTyping(true);
      ws?.send(JSON.stringify({
        type: 'typing_start',
        matchId: selectedChat.match.id
      }));
    }
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (selectedChat) {
        ws?.send(JSON.stringify({
          type: 'typing_stop',
          matchId: selectedChat.match.id
        }));
      }
    }, 1000);
  }, [isTyping, selectedChat, ws]);

  const handleSendMessage = useCallback(async (messageType: string = "text", imageUrl?: string) => {
    if ((!message.trim() && messageType === "text") || !selectedChat || sending) return;

    setSending(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: selectedChat.match.id,
          content: messageType === "text" ? message : "ส่งรูปภาพ",
          messageType,
          imageUrl,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setSelectedChat(prev => {
          if (!prev) return null;
          const updatedMessages = [...prev.messages, newMessage];
          return {
            ...prev,
            messages: updatedMessages,
            lastMessage: newMessage,
          };
        });
        
        // ✅ Update cache
        setMessageCache(prev => {
          const newCache = new Map(prev);
          const existing = newCache.get(selectedChat.match.id) || [];
          newCache.set(selectedChat.match.id, [...existing, newMessage]);
          return newCache;
        });
        
        setMessage("");
      } else {
        throw new Error(`Failed to send message: ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งข้อความได้",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }, [message, selectedChat, sending, getAuthToken, toast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "ไฟล์ไม่ถูกต้อง",
        description: "กรุณาเลือกไฟล์รูปภาพ",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ไฟล์ใหญ่เกินไป",
        description: "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      const token = getAuthToken();
      if (!token) return;

      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (uploadResponse.ok) {
        const { imageUrl } = await uploadResponse.json();
        await handleSendMessage("image", imageUrl);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดรูปภาพได้",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;

    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/matches/${selectedChat.match.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // ลบ match ออกจาก list และปิดแชท
        setMatches(prev => prev.filter(m => m.id !== selectedChat.match.id));
        setSelectedChat(null);
        
        // ลบจาก cache
        setMessageCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(selectedChat.match.id);
          return newCache;
        });
        
        toast({
          title: "ลบแชทสำเร็จ",
          description: "แชทและข้อความทั้งหมดถูกลบแล้ว",
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบแชทได้",
        variant: "destructive",
      });
    }
    setShowDeleteConfirm(false);
  };

  const handleDeleteAllChats = async () => {
    if (matches.length === 0) return;

    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/matches/all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMatches([]);
        setSelectedChat(null);
        setMessageCache(new Map());
        
        toast({
          title: "ลบแชททั้งหมดสำเร็จ",
          description: "แชทและข้อความทั้งหมดถูกลบแล้ว",
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบแชททั้งหมดได้",
        variant: "destructive",
      });
    }
  };

  // WebSocket connection setup
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const setupWebSocket = () => {
      if (!user) return;
      
      const token = getAuthToken();
      if (!token) {
        console.warn('No auth token available for WebSocket connection');
        return;
      }

      // Use correct WebSocket URL for development with /ws path
      const wsUrl = import.meta.env.DEV 
        ? `ws://localhost:5000/ws` 
        : `wss://${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      
      try {
        const websocket = new WebSocket(wsUrl);
        
        websocket.onopen = () => {
          console.log('WebSocket connected successfully');
          reconnectAttempts = 0; // Reset on successful connection
          websocket.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
          
          // Show success toast for first connection
          if (reconnectAttempts === 0) {
            toast({
              title: "เชื่อมต่อสำเร็จ",
              description: "พร้อมรับข้อความแบบเรียลไทม์",
            });
          }
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            switch (data.type) {
              case 'auth_success':
                console.log('WebSocket authentication successful');
                break;
                
              case 'new_message':
                if (data.message) {
                  // Update current chat if it's the same match
                  if (selectedChat?.match.id === data.message.matchId) {
                    setSelectedChat(prev => {
                      if (!prev) return null;
                      
                      // Check if message already exists to prevent duplicates
                      const messageExists = prev.messages.some(msg => msg.id === data.message.id);
                      if (messageExists) return prev;
                      
                      const updatedMessages = [...prev.messages, data.message];
                      return {
                        ...prev,
                        messages: updatedMessages,
                        lastMessage: data.message,
                      };
                    });
                    
                    // Mark as read if chat is currently open
                    markMessagesAsRead(data.message.matchId);
                  }
                  
                  // Update cache
                  setMessageCache(prev => {
                    const newCache = new Map(prev);
                    const existing = newCache.get(data.message.matchId) || [];
                    
                    // Check if message already exists in cache
                    const messageExists = existing.some(msg => msg.id === data.message.id);
                    if (!messageExists) {
                      newCache.set(data.message.matchId, [...existing, data.message]);
                    }
                    return newCache;
                  });
                  
                  // Update matches list with new message
                  setMatches(prev => prev.map(match => 
                    match.id === data.message.matchId
                      ? { 
                          ...match, 
                          lastMessage: data.message,
                          unreadCount: selectedChat?.match.id === data.message.matchId ? 0 : (match.unreadCount || 0) + 1
                        }
                      : match
                  ));

                  // Show toast notification if message is not from current chat
                  if (selectedChat?.match.id !== data.message.matchId) {
                    const senderMatch = matches.find(m => m.id === data.message.matchId);
                    if (senderMatch) {
                      toast({
                        title: `ข้อความใหม่จาก ${senderMatch.otherUser.nickname}`,
                        description: data.message.content.length > 50 
                          ? data.message.content.substring(0, 50) + "..." 
                          : data.message.content,
                      });
                    }
                  }
                }
                break;
                
              case 'typing_start':
                // Handle typing indicators if needed
                break;
                
              case 'typing_stop':
                // Handle typing indicators if needed
                break;
                
              default:
                console.log('Unknown WebSocket message type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        websocket.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          setWs(null);
          
          // Reconnection logic with exponential backoff
          if (user && !event.wasClean && reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Attempting to reconnect WebSocket in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
            reconnectAttempts++;
            
            reconnectTimer = setTimeout(() => {
              setupWebSocket();
            }, delay);
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            console.error('Max WebSocket reconnection attempts reached');
            toast({
              title: "การเชื่อมต่อขาดหาย",
              description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณารีเฟรชหน้า",
              variant: "destructive",
            });
          }
        };
        
        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          
          // Show error toast only if this is the first connection attempt
          if (reconnectAttempts === 0) {
            toast({
              title: "การเชื่อมต่อล้มเหลว",
              description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กำลังพยายามเชื่อมต่อใหม่...",
              variant: "destructive",
            });
          }
        };
        
        setWs(websocket);
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
    };

    setupWebSocket();
    loadMatches();
    
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws) {
        ws.close(1000, 'Component unmounting');
        setWs(null);
      }
    };
  }, [user, getAuthToken, toast]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (selectedChat && selectedChat.messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedChat?.messages]);

  // เมื่อเลือกแชท
  const handleSelectChat = async (match: Match) => {
    await loadMessages(match);
    setView('chat');
  };

  // ปุ่มย้อนกลับ
  const handleBackToList = () => {
    setView('list');
    setSelectedChat(null);
  };

  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-100 min-h-screen">
      <div className="flex h-full flex-col overflow-auto">
        {/* Chat List */}
        {view === 'list' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-lg mx-auto mt-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-amber-100 p-6">
              <h2 className="text-2xl font-bold text-amber-600 mb-4 text-center drop-shadow">แชทของคุณ</h2>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-amber-200 shadow-lg"></div>
                      <div className="text-amber-600 font-semibold">กำลังโหลด...</div>
                    </div>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6">
                    <MessageCircle className="w-14 h-14 mb-2 opacity-50" />
                    <p className="text-lg font-medium">ยังไม่มีแชท</p>
                    <p className="text-sm">เริ่มต้นแชทกับเพื่อนใหม่ของคุณ</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-amber-100">
                    {matches.map(match => (
                      <li
                        key={match.id}
                        className={`
                          transition-all duration-200 cursor-pointer
                          hover:bg-amber-100/60 active:bg-amber-200/80
                          rounded-2xl my-2 shadow-sm
                          ${selectedChat?.match.id === match.id ? 'bg-amber-50 border-l-4 border-amber-400' : ''}
                        `}
                        onClick={() => handleSelectChat(match)}
                      >
                        <div className="flex items-center gap-4 p-4">
                          <div className="relative">
                            <img 
                              src={match.otherUser.profileImage || ''} 
                              alt="" 
                              className="w-14 h-14 rounded-full object-cover border-2 border-amber-200 shadow-md" 
                            />
                            {match.otherUser.isActive && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">{match.otherUser.nickname}</span>
                              {/* เพิ่มบรรทัดนี้เพื่อแสดงเวลาข้อความล่าสุด */}
                              <span className="text-xs text-gray-400">
                                {match.lastMessage ? formatTime(match.lastMessage.createdAt) : null}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {match.lastMessage?.content || 'ยังไม่มีข้อความ'}
                            </p>
                          </div>
                          {match.unreadCount ? (
                            <span className="flex items-center justify-center w-6 h-6 bg-amber-500 text-white rounded-full text-xs font-bold shadow">
                              {match.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Window */}
        {view === 'chat' && selectedChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-full max-w-2xl mx-auto bg-white/90 rounded-3xl shadow-2xl border border-amber-100 flex flex-col h-[80vh] relative">
              {/* Chat Header */}
              <div className="p-4 border-b border-amber-100 bg-white/80 rounded-t-3xl flex items-center justify-between shadow">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToList}
                    className="mr-2"
                  >
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500"><path d="M15 18l-6-6 6-6"/></svg>
                  </Button>
                  <img 
                    src={selectedChat.match.otherUser.profileImage || ''} 
                    alt="" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-amber-200 shadow" 
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedChat.match.otherUser.nickname}</h3>
                    {isTyping && <p className="text-xs text-amber-600 animate-pulse">กำลังพิมพ์...</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedChat.match.otherUser.instagram && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openInstagram(selectedChat.match.otherUser.instagram)}
                    >
                      <ExternalLink className="w-5 h-5 text-amber-500" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </Button>
                </div>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-amber-50/60 to-white/80 p-6 space-y-4 rounded-b-3xl">
                {selectedChat.messages.map(msg => {
                  const isSender = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isSender ? 'order-2' : 'order-1'}`}>
                        {msg.messageType === 'image' ? (
                          <div className="rounded-2xl overflow-hidden shadow-lg border border-amber-100">
                            <img src={msg.imageUrl} alt="Shared" className="max-w-full h-auto" />
                          </div>
                        ) : (
                          <div className={`
                            px-5 py-3 rounded-2xl shadow-md border
                            ${isSender 
                              ? 'bg-amber-500/90 text-white border-amber-200 rounded-br-none'
                              : 'bg-white/90 text-gray-900 border-amber-100 rounded-bl-none'}
                          `}>
                            <p className="text-base">{msg.content}</p>
                            <span className="text-[11px] opacity-70 mt-1 block text-right">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              {/* Input Area */}
              <div className="p-4 bg-white/80 border-t border-amber-100 rounded-b-3xl">
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                  >
                    <ImageIcon className="w-6 h-6 text-amber-600" />
                  </Button>
                  <div className="flex-1">
                    <Input
                      value={message}
                      onChange={handleTyping}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="พิมพ์ข้อความ..."
                      disabled={sending}
                      className="border-amber-200 focus:ring-amber-500 bg-white/80 rounded-xl shadow"
                    />
                  </div>
                  <Button 
                    onClick={() => handleSendMessage()} 
                    disabled={sending || !message.trim()}
                    className={`bg-amber-500 hover:bg-amber-600 text-white shadow-lg rounded-xl ${
                      sending ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal ยืนยันลบแชท (optional, เพิ่มความสวยงาม) */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-amber-100 flex flex-col items-center">
              <Trash2 className="w-10 h-10 text-red-500 mb-2" />
              <h4 className="text-lg font-bold mb-2">ยืนยันการลบแชท</h4>
              <p className="text-gray-500 mb-4">คุณต้องการลบแชทนี้จริงหรือไม่?</p>
              <div className="flex gap-4">
                <Button onClick={handleDeleteChat} className="bg-red-500 hover:bg-red-600 text-white rounded-lg shadow">
                  ลบ
                </Button>
                <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="rounded-lg">
                  ยกเลิก
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
