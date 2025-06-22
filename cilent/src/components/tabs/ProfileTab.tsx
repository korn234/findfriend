import { Edit, Settings, HelpCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import type { User } from "@shared/schema";
import { useLocation } from "wouter";

interface ProfileTabProps {
  user: User;
}

function ProfileTab({ user }: ProfileTabProps) {
  const [, navigate] = useLocation();

  const handleLogout = () => {
    auth.logout();
  };

  const showSettings = () => {
    navigate("/settings");
  };

  const showHelp = () => {
    navigate("/help");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-gradient-to-br from-accent-pink to-tea-milk-medium rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-gentle">
          <span className="text-white text-3xl font-bold">
            {user.nickname[0]?.toUpperCase()}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-accent-brown mb-1 animate-in slide-in-from-bottom duration-500 delay-100">{user.nickname}</h2>
        <p className="text-tea-milk-dark animate-in slide-in-from-bottom duration-500 delay-200">{user.age}</p>
        {user.instagram && (
          <p className="text-sm text-tea-milk-dark animate-in slide-in-from-bottom duration-500 delay-300">{user.instagram}</p>
        )}
      </div>

      {/* Profile Settings */}
      <div className="space-y-3">
        <button
          onClick={showSettings}
          className="w-full bg-white rounded-2xl shadow-tea p-4 border border-tea-milk-base flex items-center justify-between card-hover hover:scale-105 transform transition-all duration-300 animate-in slide-in-from-right duration-500 delay-300"
        >
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-accent-brown" />
            <span className="font-medium text-accent-brown">การตั้งค่า</span>
          </div>
          <span className="text-tea-milk-dark">›</span>
        </button>

        <button
          onClick={showHelp}
          className="w-full bg-white rounded-2xl shadow-tea p-4 border border-tea-milk-base flex items-center justify-between card-hover hover:scale-105 transform transition-all duration-300 animate-in slide-in-from-right duration-500 delay-400"
        >
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-5 h-5 text-accent-brown" />
            <span className="font-medium text-accent-brown">ช่วยเหลือ</span>
          </div>
          <span className="text-tea-milk-dark">›</span>
        </button>

        <Button
          onClick={handleLogout}
          className="w-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-2xl shadow-tea p-4 flex items-center justify-center card-hover hover:scale-105 transform transition-all duration-300 animate-in slide-in-from-bottom duration-500 delay-500"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">ออกจากระบบ</span>
        </Button>
      </div>
    </div>
  );
}

export default ProfileTab;
