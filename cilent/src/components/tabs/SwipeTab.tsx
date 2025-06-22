import { useState, useRef, useEffect } from "react";
import { Heart, X, RotateCcw, Star, ChevronDown, MessageCircle, Camera, Plus, MapPin, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSetupSchema, type ProfileSetupData, type User } from "@shared/schema";

interface Profile {
  id: number;
  nickname: string;
  age: string;
  bio?: string;
  interests?: string[];
  hobbies?: string;
  instagram?: string;
  profileImage?: string;
  province?: string;
  school?: string;
}

const INTEREST_OPTIONS = [
  "ชานมไข่มุก", "กาแฟ", "ดนตรี", "ภาพยนตร์", "อาหาร", "ท่องเที่ยว",
  "ออกกำลังกาย", "อ่านหนังสือ", "เกม", "ถ่ายรูป", "ช้อปปิ้ง", "ทำอาหาร",
  "ศิลปะ", "กีฬา", "แฟชั่น", "เทคโนโลยี"
];

const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น",
  "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย",
  "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา",
  "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์",
  "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พังงา",
  "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม",
  "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี",
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
  "สมุทรสาคร", "สมุทรสงคราม", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี",
  "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี",
  "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

function ProfileSetupInSwipe({ user, onComplete }: { user: User | null; onComplete: () => void }) {
  const { toast } = useToast();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");

  // Load saved profile data from localStorage
  const loadSavedProfile = () => {
    const saved = localStorage.getItem(`profile_draft_${user?.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved profile:", e);
      }
    }
    return {
      profileImage: "",
      bio: "",
      interests: [],
      hobbies: "",
      province: "",
      school: "",
    };
  };

  const savedData = loadSavedProfile();

  const form = useForm<ProfileSetupData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: savedData,
  });

  // Initialize state from saved data
  useEffect(() => {
    setSelectedInterests(savedData.interests || []);
    setImagePreview(savedData.profileImage || "");
    setSelectedProvince(savedData.province || "");
  }, []);

  // Save profile data to localStorage whenever form changes
  const saveProfileDraft = (data: Partial<ProfileSetupData>) => {
    const currentData = form.getValues();
    const updatedData = { ...currentData, ...data };
    localStorage.setItem(`profile_draft_${user?.id}`, JSON.stringify(updatedData));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        form.setValue("profileImage", result);
        saveProfileDraft({ profileImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interest: string) => {
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    setSelectedInterests(newInterests);
    form.setValue("interests", newInterests);
    saveProfileDraft({ interests: newInterests });
  };

  const profileSetupMutation = useMutation({
    mutationFn: async (data: ProfileSetupData) => {
      const response = await apiRequest("POST", "/api/profile-setup", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "สร้างโปรไฟล์สำเร็จ",
        description: "เริ่มค้นหาเพื่อนใหม่กันเถอะ!",
      });
      // Clear draft data after successful save
      localStorage.removeItem(`profile_draft_${user?.id}`);
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "การสร้างโปรไฟล์ไม่สำเร็จ",
        description: error.message || "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    },
  });



  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    form.setValue("province", province);
    saveProfileDraft({ province });
  };

  const onSubmit = (data: ProfileSetupData) => {
    profileSetupMutation.mutate(data, {
      onSuccess: () => {
        window.location.reload(); // รีเฟรชหน้าจอหลังสร้างโปรไฟล์สำเร็จ
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-in slide-in-from-top duration-500">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">สวัสดี {user?.nickname}!</h1>
          <p className="text-gray-600">มาสร้างโปรไฟล์เพื่อค้นหาเพื่อนใหม่กัน</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Photo - Card Style */}
          <div className="animate-in slide-in-from-bottom duration-700">
            <Label className="text-base font-medium text-gray-700 mb-3 block flex items-center gap-2">
              <Camera className="w-4 h-4" />
              รูปบัตรโปรไฟล์
            </Label>
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative w-48 h-64 rounded-2xl overflow-hidden border-4 border-amber-200 group-hover:border-amber-300 transition-colors shadow-lg">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                ) : (
                  <div className="w-48 h-64 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 border-4 border-amber-200 group-hover:border-amber-300 transition-colors flex flex-col items-center justify-center shadow-lg">
                    <Camera className="w-12 h-12 text-amber-600 mb-3" />
                    <span className="text-amber-700 text-sm font-medium">เพิ่มรูปบัตร</span>
                    <span className="text-amber-600 text-xs mt-1">สำหรับแสดงให้เพื่อนเห็น</span>
                  </div>
                )}
              </label>
            </div>
            {form.formState.errors.profileImage && (
              <p className="mt-2 text-sm text-red-600 text-center">{form.formState.errors.profileImage.message}</p>
            )}
          </div>

          {/* Bio */}
          <div className="animate-in slide-in-from-bottom duration-700 delay-100">
            <Label className="text-base font-medium text-gray-700 mb-3 block">แนะนำตัว</Label>
            <Textarea
              {...form.register("bio")}
              placeholder="เล่าเกี่ยวกับตัวคุณสักหน่อย..."
              className="min-h-20 resize-none border-2 border-gray-200 focus:border-amber-300 transition-colors"
              onChange={(e) => {
                form.setValue("bio", e.target.value);
                saveProfileDraft({ bio: e.target.value });
              }}
            />
            {form.formState.errors.bio && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.bio.message}</p>
            )}
          </div>

          {/* Interests */}
          <div className="animate-in slide-in-from-bottom duration-700 delay-200">
            <Label className="text-base font-medium text-gray-700 mb-3 block">ความชอบ</Label>
            <div className="grid grid-cols-2 gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedInterests.includes(interest)
                      ? "bg-amber-300 text-amber-900 transform scale-105"
                      : "bg-white text-gray-700 hover:bg-amber-50 hover:scale-102"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            {form.formState.errors.interests && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.interests.message}</p>
            )}
          </div>

          {/* Hobbies */}
          <div className="animate-in slide-in-from-bottom duration-700 delay-300">
            <Label className="text-base font-medium text-gray-700 mb-3 block">งานอดิเรก</Label>
            <Input
              {...form.register("hobbies")}
              placeholder="เล่นกีต้าร์ ฟังเพลง วาดรูป..."
              className="border-2 border-gray-200 focus:border-amber-300 transition-colors"
              onChange={(e) => {
                form.setValue("hobbies", e.target.value);
                saveProfileDraft({ hobbies: e.target.value });
              }}
            />
            {form.formState.errors.hobbies && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.hobbies.message}</p>
            )}
          </div>

          {/* Province */}
          <div className="animate-in slide-in-from-bottom duration-700 delay-400">
            <Label className="text-base font-medium text-gray-700 mb-3 block flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              จังหวัด
            </Label>
            <Select onValueChange={handleProvinceSelect} value={selectedProvince}>
              <SelectTrigger className="border-2 border-gray-200 focus:border-amber-300 transition-colors">
                <SelectValue placeholder="เลือกจังหวัด" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {PROVINCES.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.province && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.province.message}</p>
            )}
          </div>

          {/* School */}
          <div className="animate-in slide-in-from-bottom duration-700 delay-500">
            <Label className="text-base font-medium text-gray-700 mb-3 block flex items-center gap-2">
              <School className="w-4 h-4" />
              โรงเรียน
            </Label>
            <Input
              {...form.register("school")}
              placeholder="ใส่ชื่อโรงเรียนของคุณ..."
              className="border-2 border-gray-200 focus:border-amber-300 transition-colors"
              onChange={(e) => {
                form.setValue("school", e.target.value);
                saveProfileDraft({ school: e.target.value });
              }}
            />
            {form.formState.errors.school && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.school.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="animate-in slide-in-from-bottom duration-700 delay-600">
            <Button
              type="submit"
              disabled={profileSetupMutation.isPending}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white py-4 rounded-xl text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              {profileSetupMutation.isPending ? "กำลังสร้างโปรไฟล์..." : "✨ เริ่มค้นหาเพื่อน"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}



export function SwipeTab() {
  const { user } = useAuth() as { user: User | null };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [showHoverHints, setShowHoverHints] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch potential matches
  const { data: profiles = [], isLoading, refetch } = useQuery<Profile[]>({
    queryKey: ["/api/potential-matches"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await apiRequest("POST", "/api/match", { targetUserId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "แมทช์สำเร็จ! 🎉",
        description: "คุณสามารถเริ่มแชทได้แล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      window.dispatchEvent(new CustomEvent('matchCreated'));

      // Initial message is created on the server
    },
    onError: (error: any) => {
      toast({
        title: "ไม่สามารถแมทช์ได้",
        description: error.message || "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    },
  });

  // Hide hover hints after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHoverHints(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!user?.profileCompleted) {
    return <ProfileSetupInSwipe user={user} onComplete={() => refetch()} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังค้นหาเพื่อนใหม่...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-8 shadow-lg max-w-sm">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่มีเพื่อนใหม่</h2>
          <p className="text-gray-600 mb-6">ลองกลับมาดูใหม่ภายหลัง หรือชวนเพื่อนมาใช้กันเยอะๆ</p>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/potential-matches"] });
              refetch();
            }}
            className="btn-primary"
          >
            ค้นหาอีกครั้ง
          </Button>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex] as Profile;

  const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const resetCard = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(0) translateY(0) rotate(0deg)';
      cardRef.current.style.opacity = '1';
    }
    setDragOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // เรียก preventDefault เฉพาะ mouse event
    if ('button' in e) e.preventDefault();
    setIsDragging(true);
    const coords = getEventCoordinates(e);
    // Store initial position
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    // เรียก preventDefault เฉพาะ mouse event
    if ('button' in e) e.preventDefault();

    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const coords = getEventCoordinates(e);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = coords.x - centerX;
    const deltaY = coords.y - centerY;

    setDragOffset({ x: deltaX, y: deltaY });
    setRotation(deltaX * 0.1);

    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) rotate(${deltaX * 0.1}deg)`;
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 100;
    if (dragOffset.x > threshold) {
      handleLike();
    } else if (dragOffset.y > threshold) {
      handlePass();
    } else {
      // Snap back
      resetCard();
    }
  };

  const handleLike = () => {
    createMatchMutation.mutate(currentProfile.id);
    
    // Animate card to the right
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(100vw) rotate(30deg)';
      cardRef.current.style.opacity = '0';
    }
    
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      resetCard();
    }, 300);
  };

  const handlePass = () => {
    // Animate card down
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateY(100vh)';
      cardRef.current.style.opacity = '0';
    }
    
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      resetCard();
    }, 300);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 overflow-hidden">
      {/* Header */}
      <div className="relative z-20 flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-gray-800">ค้นหาเพื่อน</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-gray-600 hover:text-amber-600"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Hover Hints */}
      {showHoverHints && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <div className="absolute top-1/2 left-8 transform -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm animate-bounce">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>ปัดขวาเพื่อแชท</span>
            </div>
          </div>
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm animate-bounce delay-300">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4" />
              <span>เลื่อนลงเพื่อหาคนต่อไป</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Card Container */}
      <div className="absolute inset-4 flex items-center justify-center">
        <div
          ref={cardRef}
          className="relative w-full max-w-md h-full max-h-[700px] bg-white rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing transform-gpu transition-transform duration-300 ease-out"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          {/* Swipe Action Indicators */}
          <div className={`absolute top-8 left-8 z-10 px-4 py-2 rounded-full font-bold text-xl transform transition-all duration-300 ${
            dragOffset.x > 50 ? 'scale-110 opacity-100' : 'scale-75 opacity-0'
          } bg-green-500 text-white shadow-lg`}>
            LIKE ❤️
          </div>
          
          <div className={`absolute top-8 right-8 z-10 px-4 py-2 rounded-full font-bold text-xl transform transition-all duration-300 ${
            dragOffset.y > 50 ? 'scale-110 opacity-100' : 'scale-75 opacity-0'
          } bg-red-500 text-white shadow-lg`}>
            PASS ✋
          </div>

          {/* Profile Image Section */}
          <div className="relative h-3/5 overflow-hidden">
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              {currentProfile.profileImage ? (
                <img
                  src={currentProfile.profileImage}
                  alt={currentProfile.nickname}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center">
                  <div className="text-6xl text-white">👤</div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>

            {/* Profile Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="mb-4">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  {currentProfile.nickname}
                  <span className="text-lg bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {currentProfile.age}
                  </span>
                </h2>
                {currentProfile.bio && (
                  <p className="text-base text-white/90 leading-relaxed mb-4">
                    {currentProfile.bio}
                  </p>
                )}
              </div>

              {/* Interests */}
              {currentProfile.interests && currentProfile.interests.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests.map((interest, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="text-sm text-white/80 space-y-1">
                {currentProfile.hobbies && <p>🎯 {currentProfile.hobbies}</p>}
                {currentProfile.province && <p>📍 {currentProfile.province}</p>}
                {currentProfile.school && <p>🏫 {currentProfile.school}</p>}
                {currentProfile.instagram && <p>📸 {currentProfile.instagram}</p>}
              </div>
            </div>
          </div>

          {/* Extended Details Section */}
          <div className="h-2/5 p-6 bg-white overflow-y-auto">
            <div className="space-y-4">
              {currentProfile.bio && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">เกี่ยวกับฉัน</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{currentProfile.bio}</p>
                </div>
              )}

              {currentProfile.interests && currentProfile.interests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">ความชอบ</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentProfile.hobbies && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">งานอดิเรก</h3>
                  <p className="text-sm text-gray-600">{currentProfile.hobbies}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-12 px-4">
        <Button
          onClick={handlePass}
          className="w-16 h-16 rounded-full bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 hover:scale-110 transform transition-all duration-300 shadow-lg"
        >
          <X className="w-8 h-8" />
        </Button>
        
        <Button
          onClick={handleLike}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 to-red-400 text-white hover:from-pink-500 hover:to-red-500 hover:scale-110 transform transition-all duration-300 shadow-lg"
        >
          <Heart className="w-8 h-8" />
        </Button>
      </div>

      {/* Profile Counter */}
      <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm text-gray-600">
        {currentIndex + 1} / {profiles.length}
      </div>
    </div>
  );
}
