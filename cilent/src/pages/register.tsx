import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { registerSchema, type RegisterData } from "@shared/schema";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nickname: "",
      age: "",
      instagram: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: auth.register,
    onSuccess: () => {
      toast({
        title: "สมัครสมาชิกสำเร็จ",
        description: "ยินดีต้อนรับสู่ Friend Finder!",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "การสมัครสมาชิกไม่สำเร็จ",
        description: error.message || "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-accent-brown mb-2">☕ Friend Finder</h1>
          <p className="text-tea-milk-dark text-lg">เข้าร่วมชุมชนกันเถอะ</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-tea-lg p-6 border border-tea-milk-base">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="nickname" className="block text-sm font-medium leading-6 text-accent-brown">
                ชื่อเล่น
              </Label>
              <div className="mt-2">
                <Input
                  id="nickname"
                  type="text"
                  placeholder="ชื่อเล่นที่ใช้ในแอป"
                  className="form-input block w-full rounded-xl border-0 py-3 px-4 bg-tea-milk-light ring-1 ring-inset ring-tea-milk-medium focus:ring-2 focus:ring-inset focus:ring-tea-milk-dark"
                  {...form.register("nickname")}
                />
                {form.formState.errors.nickname && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.nickname.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="age" className="block text-sm font-medium leading-6 text-accent-brown">
                อายุ
              </Label>
              <div className="mt-2">
                <Select onValueChange={(value) => form.setValue("age", value)}>
                  <SelectTrigger className="form-input w-full rounded-xl border-0 py-3 px-4 bg-tea-milk-light ring-1 ring-inset ring-tea-milk-medium focus:ring-2 focus:ring-inset focus:ring-tea-milk-dark">
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
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.age.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="instagram" className="block text-sm font-medium leading-6 text-accent-brown">
                Instagram <span className="text-sm text-gray-500">(ไม่บังคับ)</span>
              </Label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">@</span>
                </div>
                <Input
                  id="instagram"
                  type="text"
                  placeholder="username"
                  className="form-input block w-full rounded-xl border-0 py-3 pl-8 pr-4 bg-tea-milk-light ring-1 ring-inset ring-tea-milk-medium focus:ring-2 focus:ring-inset focus:ring-tea-milk-dark"
                  {...form.register("instagram")}
                />
                {form.formState.errors.instagram && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.instagram.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium leading-6 text-accent-brown">
                รหัสผ่าน
              </Label>
              <div className="mt-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  className="form-input block w-full rounded-xl border-0 py-3 px-4 bg-tea-milk-light ring-1 ring-inset ring-tea-milk-medium focus:ring-2 focus:ring-inset focus:ring-tea-milk-dark"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-accent-brown">
                ยืนยันรหัสผ่าน
              </Label>
              <div className="mt-2">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="ใส่รหัสผ่านอีกครั้ง"
                  className="form-input block w-full rounded-xl border-0 py-3 px-4 bg-tea-milk-light ring-1 ring-inset ring-tea-milk-medium focus:ring-2 focus:ring-inset focus:ring-tea-milk-dark"
                  {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="btn-primary flex w-full justify-center rounded-xl px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tea-milk-dark"
              >
                {registerMutation.isPending ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-tea-milk-dark">
            มีบัญชีแล้ว?
            <button
              onClick={() => navigate("/login")}
              className="font-semibold leading-6 text-accent-brown hover:text-accent-brown/80 ml-1"
            >
              เข้าสู่ระบบ
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
