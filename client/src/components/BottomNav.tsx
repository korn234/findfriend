import { Heart, MessageCircle, Video, User } from "lucide-react";

interface BottomNavProps {
  activeTab: "swipe" | "chat" | "video" | "profile";
  onTabChange: (tab: "swipe" | "chat" | "video" | "profile") => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    {
      id: "swipe" as const,
      label: "ปัดหา",
      icon: Heart,
    },
    {
      id: "chat" as const,
      label: "แชท",
      icon: MessageCircle,
    },
    {
      id: "video" as const,
      label: "วิดีโอ",
      icon: Video,
    },
    {
      id: "profile" as const,
      label: "โปรไฟล์",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-tea-milk-base z-50 animate-slide-up">
      <div className="grid grid-cols-4 py-2">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`tab-transition flex flex-col items-center py-2 px-1 transform hover:scale-110 active:scale-95 animate-in fade-in duration-300 ${
                isActive
                  ? "text-accent-brown"
                  : "text-tea-milk-dark hover:text-accent-brown"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`relative ${isActive ? 'animate-bounce-gentle' : ''}`}>
                <Icon className={`w-6 h-6 mb-1 transition-all duration-300 ${isActive ? 'text-accent-brown' : ''}`} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-brown rounded-full animate-pulse-soft"></div>
                )}
              </div>
              <span className={`text-xs font-medium transition-all duration-300 ${isActive ? 'text-accent-brown font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
