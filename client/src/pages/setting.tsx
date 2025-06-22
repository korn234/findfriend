import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, ArrowLeft, MapPin, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { settingsSchema, type SettingsData, type User } from "@shared/schema";
import { apiRequest, getQueryFn, invalidateQueries } from "@/lib/queryClient";
import { useLocation } from "wouter";

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

export default function Settings() {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string>("");
  const [, navigate] = useLocation();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [schoolSearch, setSchoolSearch] = useState<string>("");
  const [schoolResults, setSchoolResults] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");

  // Fetch current user data
  const { data: currentUser, isLoading } = useQuery<User>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const form = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      nickname: "",
      age: "",
      instagram: "",
      bio: "",
      interests: [],
      hobbies: "",
      province: "",
      school: "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Update form with current user data when loaded
  useEffect(() => {
    if (currentUser) {
      form.setValue("nickname", currentUser.nickname || "");
      form.setValue("age", currentUser.age || "");
      form.setValue("instagram", currentUser.instagram?.replace("@", "") || "");
      form.setValue("bio", currentUser.bio || "");
      form.setValue("hobbies", currentUser.hobbies || "");
      form.setValue("province", currentUser.province || "");
      form.setValue("school", currentUser.school || "");
      
      if (currentUser.interests) {
        setSelectedInterests(currentUser.interests);
        form.setValue("interests", currentUser.interests);
      }
      
      if (currentUser.province) {
        setSelectedProvince(currentUser.province);
      }
      
      if (currentUser.school) {
        setSelectedSchool(currentUser.school);
        setSchoolSearch(currentUser.school);
      }
      
      if (currentUser.profileImage) {
        setImagePreview(currentUser.profileImage);
        form.setValue("profileImage", currentUser.profileImage);
      }
    }
  }, [currentUser, form]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        form.setValue("profileImage", result);
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
  };

  const searchSchoolsMutation = useMutation({
    mutationFn: async (searchData: { query: string; province?: string }) => {
      const response = await apiRequest("POST", "/api/schools/search", searchData);
      return response.json();
    },
    onSuccess: (schools) => {
      setSchoolResults(schools);
    },
  });

  const handleSchoolSearch = (query: string) => {
    setSchoolSearch(query);
    if (query.length >= 2) {
      searchSchoolsMutation.mutate({ query, province: selectedProvince });
    } else {
      setSchoolResults([]);
    }
  };

  const handleSchoolSelect = (school: any) => {
    setSelectedSchool(school.name);
    setSchoolSearch(school.name);
    form.setValue("school", school.name);
    setSchoolResults([]);
  };

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    form.setValue("province", province);
    // Clear school selection when province changes
    if (province !== selectedProvince) {
      setSelectedSchool("");
      setSchoolSearch("");
      form.setValue("school", "");
      setSchoolResults([]);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      const response = await apiRequest("PUT", "/api/me", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate user query to refresh data
      invalidateQueries.user();
      toast({
        title: "อัพเดทโปรไฟล์สำเร็จ",
        description: "ข้อมูลของคุณถูกบันทึกแล้ว",
      });
    },
    onError: (error: any) => {
      toast({
        title: "อัพเดทโปรไฟล์ไม่สำเร็จ",
        description: error.message || "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsData) => {
    if (!data.newPassword) {
      delete data.currentPassword;
      delete data.newPassword;
      delete data.confirmNewPassword;
    }
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tea-milk-light to-tea-milk-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-brown mx-auto mb-4"></div>
          <p className="text-tea-milk-dark">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tea-milk-light to-tea-milk-cream">
      <div className="px-6 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/?tab=profile")}
            className="mr-4 p-2 hover:bg-white/50 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-accent-brown" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-accent-brown mb-2">⚙️ ตั้งค่า</h1>
            <p className="text-tea-milk-dark">แก้ไขข้อมูลส่วนตัว</p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">
          {/* Profile Picture */}
          <div>
            <Label className="block text-sm font-medium text-accent-brown mb-3">
              รูปโปรไฟล์
            </Label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="group block w-full aspect-[3/4] bg-white rounded-2xl border-2 border-dashed border-tea-milk-base hover:border-tea-milk-medium transition-all duration-300 cursor-pointer overflow-hidden card-hover"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-tea-milk-dark group-hover:text-accent-brown transition-colors duration-300">
                    <Camera className="w-12 h-12 mb-3 animate-bounce" />
                    <p className="text-sm font-medium">เปลี่ยนรูปโปรไฟล์</p>
                    <p className="text-xs mt-1">แนวตั้ง สวยๆ</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Nickname */}
          <div>
            <Label htmlFor="nickname" className="block text-sm font-medium text-accent-brown mb-3">
              ชื่อเล่น
            </Label>
            <Input
              id="nickname"
              type="text"
              placeholder="ชื่อเล่นที่ใช้ในแอป"
              className="form-input rounded-xl border-0 bg-white ring-1 ring-tea-milk-base focus:ring-2 focus:ring-tea-milk-dark"
              {...form.register("nickname")}
            />
            {form.formState.errors.nickname && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.nickname.message}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <Label htmlFor="age" className="block text-sm font-medium text-accent-brown mb-3">
              อายุ
            </Label>
            <Select value={form.watch("age")} onValueChange={(value) => form.setValue("age", value)}>
              <SelectTrigger className="form-input w-full rounded-xl border-0 bg-white ring-1 ring-tea-milk-base focus:ring-2 focus:ring-tea-milk-dark">
                <SelectValue placeholder="-- เลือกช่วงอายุ --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12-15">12-15 ปี</SelectItem>
                <SelectItem value="16-18">16-18 ปี</SelectItem>
                <SelectItem value="19-22">19-22 ปี</SelectItem>
                <SelectItem value="23-26">23-26 ปี</SelectItem>
                <SelectItem value="27-30">27-30 ปี</SelectItem>
                <SelectItem value="30+">30+ ปี</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.age && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.age.message}</p>
            )}
          </div>

          {/* Instagram */}
          <div>
            <Label htmlFor="instagram" className="block text-sm font-medium text-accent-brown mb-3">
              Instagram <span className="text-sm text-gray-500">(ไม่บังคับ)</span>
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">@</span>
              </div>
              <Input
                id="instagram"
                type="text"
                placeholder="username"
                className="form-input block w-full rounded-xl border-0 py-3 pl-8 pr-4 bg-white ring-1 ring-tea-milk-base focus:ring-2 focus:ring-tea-milk-dark"
                {...form.register("instagram")}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="block text-sm font-medium text-accent-brown mb-3">
              แนะนำตัวเอง
            </Label>
            <Textarea
              id="bio"
              placeholder="เล่าให้ฟังหน่อยว่าคุณเป็นคนยังไง..."
              className="form-input min-h-[120px] resize-none rounded-xl border-0 bg-white ring-1 ring-tea-milk-base focus:ring-2 focus:ring-tea-milk-dark"
              {...form.register("bio")}
            />
            <div className="flex justify-between mt-1">
              {form.formState.errors.bio && (
                <p className="text-sm text-red-600">{form.formState.errors.bio.message}</p>
              )}
              <p className="text-xs text-tea-milk-dark ml-auto">
                {form.watch("bio")?.length || 0}/200
              </p>
            </div>
          </div>

          {/* Interests */}
          <div>
            <Label className="block text-sm font-medium text-accent-brown mb-3">
              ความชอบ
            </Label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest, index) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105`}
                >
                  <span className={`${
                    selectedInterests.includes(interest)
                      ? "bg-gradient-to-r from-tea-milk-medium to-tea-milk-dark text-white shadow-tea"
                      : "bg-white text-tea-milk-dark border border-tea-milk-base hover:border-tea-milk-medium"
                  } px-3 py-2 rounded-full transition-all duration-300`}>
                    {interest}
                  </span>
                </button>
              ))}
            </div>
            {form.formState.errors.interests && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.interests.message}</p>
            )}
          </div>

          {/* Hobbies */}
          <div>
            <Label htmlFor="hobbies" className="block text-sm font-medium text-accent-brown mb-3">
              งานอดิเรก
            </Label>
            <Input
              id="hobbies"
              placeholder="เช่น เล่นกีต้าร์, วาดรูป, ทำขนม..."
              className="form-input rounded-xl border-0 bg-white ring-1 ring-tea-milk-base focus:ring-2 focus:ring-tea-milk-dark"
              {...form.register("hobbies")}
            />
            {form.formState.errors.hobbies && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.hobbies.message}</p>
            )}
          </div>

          {/* Province Selection */}
          <div>
            <Label className="text-base font-medium text-gray-700 mb-3 block flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              จังหวัด
            </Label>
            <Select onValueChange={handleProvinceSelect} value={selectedProvince}>
              <SelectTrigger className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-amber-300 transition-colors">
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

          {/* School Selection */}
          <div className="relative">
            <Label className="text-base font-medium text-gray-700 mb-3 block flex items-center gap-2">
              <School className="w-4 h-4" />
              โรงเรียน
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={schoolSearch}
                onChange={(e) => handleSchoolSearch(e.target.value)}
                placeholder="ค้นหาโรงเรียน..."
                className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-amber-300 transition-colors"
                disabled={!selectedProvince}
              />
              {schoolResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-white border-2 border-gray-200 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {schoolResults.map((school, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSchoolSelect(school)}
                      className="w-full p-3 text-left hover:bg-amber-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{school.name}</div>
                      {school.address && (
                        <div className="text-sm text-gray-600">{school.address}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!selectedProvince && (
              <p className="mt-2 text-sm text-gray-500">กรุณาเลือกจังหวัดก่อน</p>
            )}
            {form.formState.errors.school && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.school.message}</p>
            )}
          </div>

          {/* Current Password */}
          <div>
            <Label htmlFor="currentPassword" className="block text-sm font-medium text-accent-brown mb-3">
              รหัสผ่านปัจจุบัน
            </Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="ใส่รหัสผ่านปัจจุบัน"
              className="form-input rounded-xl border-0 bg-white ring-1 ring-tea-milk-base focus:ring-2 focus:ring-tea-milk-dark"
              {...form.register("currentPassword")}
            />
            {form.formState.errors.currentPassword && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <Label htmlFor="newPassword" className="block text-sm font-medium text-accent-brown mb-3">
              รหัสผ่านใหม่ <span className="text-sm text-gray-500">(ไม่บังคับ)</span>
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="ใส่รหัสผ่านใหม่"
              className="form-input rounded-xl border-0 bg-white ring-1 ring-tea-milk-base focus:ring-2 focus:ring-tea-milk-dark"
              {...form.register("newPassword")}
            />
            {form.formState.errors.newPassword && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <Label htmlFor="confirmNewPassword" className="block text-sm font-medium text-accent-brown mb-3">
              ยืนยันรหัสผ่านใหม่
            </Label>
            <Input
              id="confirmNewPassword"
              type="password"
              placeholder="ใส่รหัสผ่านใหม่อีกครั้ง"
              className="form-input rounded-xl border-0 bg-white ring-1 ring-tea-milk-base focus:ring-2 focus:ring-tea-milk-dark"
              {...form.register("confirmNewPassword")}
            />
            {form.formState.errors.confirmNewPassword && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.confirmNewPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full btn-primary py-4 rounded-xl text-lg font-semibold transform hover:scale-105 transition-all duration-300"
            >
              {updateProfileMutation.isPending ? "กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
