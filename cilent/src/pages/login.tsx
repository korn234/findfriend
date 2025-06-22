import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loginSchema, type LoginData } from "@shared/schema";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      nickname: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: auth.login,
    onSuccess: () => {
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับกลับมา!",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: error.message || "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-accent-brown mb-2">☕ Friend Finder</h1>
          <p className="text-tea-milk-dark text-lg">มาหาเพื่อนใหม่กันเถอะ</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-tea-lg p-6 border border-tea-milk-base">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="nickname" className="block text-sm font-medium leading-6 text-accent-brown">
                ชื่อเล่น
              </Label>
              <div className="mt-2">
                <Input
                  id="nickname"
                  type="text"
                  placeholder="ใส่ชื่อเล่นของคุณ"
                  className="form-input block w-full rounded-xl border-0 py-3 px-4 bg-tea-milk-light ring-1 ring-inset ring-tea-milk-medium focus:ring-2 focus:ring-inset focus:ring-tea-milk-dark"
                  {...form.register("nickname")}
                />
                {form.formState.errors.nickname && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.nickname.message}</p>
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
                  placeholder="ใส่รหัสผ่าน"
                  className="form-input block w-full rounded-xl border-0 py-3 px-4 bg-tea-milk-light ring-1 ring-inset ring-tea-milk-medium focus:ring-2 focus:ring-inset focus:ring-tea-milk-dark"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="btn-primary flex w-full justify-center rounded-xl px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tea-milk-dark"
              >
                {loginMutation.isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-tea-milk-dark">
            ยังไม่มีบัญชี?
            <button
              onClick={() => navigate("/register")}
              className="font-semibold leading-6 text-accent-brown hover:text-accent-brown/80 ml-1"
            >
              สมัครสมาชิก
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
