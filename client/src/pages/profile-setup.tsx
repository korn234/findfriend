import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Camera, Plus, X, MapPin, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { profileSetupSchema, type ProfileSetupData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";



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

export default function ProfileSetup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [schoolSearch, setSchoolSearch] = useState<string>("");
  const [schoolResults, setSchoolResults] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");

  const form = useForm<ProfileSetupData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      profileImage: "",
      bio: "",
      interests: [],
      hobbies: "",
      province: "",
      school: "",
    },
  });

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
      navigate("/swipe");
    },
    onError: (error: any) => {
      toast({
        title: "การสร้างโปรไฟล์ไม่สำเร็จ",
        description: error.message || "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    },
  });

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
    setSelectedSchool("");
    setSchoolSearch("");
    form.setValue("school", "");
    setSchoolResults([]);
  };

  const onSubmit = (data: ProfileSetupData) => {
    profileSetupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tea-milk-light to-tea-milk-cream animate-in fade-in duration-500">
      <div className="px-6 py-8">
        <div className="text-center mb-8 animate-in slide-in-from-top duration-700">
          <h1 className="text-3xl font-bold text-accent-brown mb-2">☕ สร้างโปรไฟล์</h1>
          <p className="text-tea-milk-dark">ทำให้เพื่อนใหม่รู้จักคุณมากขึ้น</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">
          {/* Photo Upload */}
          <div className="animate-in slide-in-from-left duration-700 delay-100">
            <Label className="block text-sm font-medium text-accent-brown mb-3">
              รูปภาพของคุณ
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
                    <p className="text-sm font-medium">เพิ่มรูปภาพ</p>
                    <p className="text-xs mt-1">แนวตั้ง สวยๆ</p>
                  </div>
                )}
              </label>
            </div>
            {form.formState.errors.profileImage && (
              <p className="mt-2 text-sm text-red-600">{form.formState.errors.profileImage.message}</p>
            )}
          </div>

          {/* Bio */}
          <div className="animate-in slide-in-from-right duration-700 delay-200">
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
          <div className="animate-in slide-in-from-left duration-700 delay-300">
            <Label className="block text-sm font-medium text-accent-brown mb-3">
              ความชอบ
            </Label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest, index) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 animate-in fade-in delay-${index * 50}`}
                  style={{
                    animationDelay: `${300 + index * 50}ms`
                  }}
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
          <div className="animate-in slide-in-from-right duration-700 delay-400">
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
          <div className="animate-in slide-in-from-bottom duration-700 delay-300">
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
          <div className="animate-in slide-in-from-bottom duration-700 delay-400 relative">
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

          {/* Submit Button */}
          <div className="animate-in slide-in-from-bottom duration-700 delay-500">
            <Button
              type="submit"
              disabled={profileSetupMutation.isPending}
              className="w-full btn-primary py-4 rounded-xl text-lg font-semibold transform hover:scale-105 transition-all duration-300"
            >
              {profileSetupMutation.isPending ? "กำลังสร้างโปรไฟล์..." : "✨ เริ่มค้นหาเพื่อน"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}