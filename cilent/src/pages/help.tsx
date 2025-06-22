import React from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Help() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 flex items-center justify-center relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-100 rounded-full opacity-40 blur-2xl animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-amber-200 rounded-full opacity-30 blur-2xl animate-pulse" />
      <div className="absolute top-10 right-1/2 w-40 h-40 bg-amber-300 rounded-full opacity-20 blur-2xl animate-bounce" />

      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-amber-100 p-12 max-w-2xl w-full flex flex-col items-center relative z-10">
        {/* Back button */}
        <div className="w-full flex justify-start mb-2">
          <button
            onClick={() => navigate("/?tab=profile")}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 font-semibold shadow transition text-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <ArrowLeft size={22} />
            <span className="tracking-wide">กลับโปรไฟล์</span>
          </button>
        </div>

        <h1 className="text-4xl font-extrabold text-amber-600 mb-6 drop-shadow animate-in fade-in duration-500">
          Donate me <span className="animate-bounce inline-block">☕</span>
        </h1>
        <img
          src="https://media.discordapp.net/attachments/1383454451179847690/1386216468731007117/IMG_7121.png?ex=6858e630&is=685794b0&hm=d001c46c1773eaf3b22eedc8035934d665c794c965528b0c1a06220ac9f26c56&=&format=webp&quality=lossless&width=761&height=989"
          alt="Donate QR"
          className="rounded-2xl shadow-lg mb-8 w-full max-w-md border-4 border-amber-100 animate-in fade-in duration-700"
        />
        <div className="text-center">
          <p className="text-2xl font-semibold text-amber-700 mb-3 animate-in slide-in-from-bottom duration-500 delay-100">
            ขอบคุณสำหรับการสนับสนุน 💛
          </p>
          <p className="text-base text-gray-600 animate-in slide-in-from-bottom duration-500 delay-200">
            ติดต่อสอบถามเพิ่มเติม IG:&nbsp;
            <a
              href="https://instagram.com/potter.x09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 underline hover:text-amber-700 transition"
            >
              @potter.x09
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
