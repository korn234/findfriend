import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { SwipeTab } from "@/components/tabs/SwipeTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { VideoTab } from "@/components/tabs/VideoTab";
import ProfileTab from "@/components/tabs/ProfileTab";

export default function Home() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"swipe" | "chat" | "video" | "profile">("swipe");
  const [location] = useLocation();

  // Set active tab from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const tabParam = params.get("tab");
    if (tabParam && ["swipe", "chat", "video", "profile"].includes(tabParam)) {
      setActiveTab(tabParam as "swipe" | "chat" | "video" | "profile");
    }
  }, [location]);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/me"],
    queryFn: auth.getCurrentUser,
    retry: false,
  });

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      navigate("/login");
      return;
    }

    if (error) {
      auth.logout();
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tea-milk-medium border-t-tea-milk-dark rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-tea-milk-dark">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "swipe":
        return <SwipeTab />;
      case "chat":
        return <ChatTab />;
      case "video":
        return <VideoTab />;
      case "profile":
        return <ProfileTab user={user} />;
      default:
        return <SwipeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tea-milk-light to-tea-milk-cream">
      {/* Fixed Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-tea-milk-base">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-accent-brown">☕ Friend Finder</h1>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-pink to-tea-milk-medium rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user.nickname[0]?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Content Container */}
      <main className="pb-20 min-h-screen">
        {renderTabContent()}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
