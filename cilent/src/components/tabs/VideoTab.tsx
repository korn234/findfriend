import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VideoTab() {
  const startRandomCall = () => {
    // TODO: Implement random video call functionality
    console.log("Starting random call");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-8 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-accent-brown mb-2 animate-bounce-gentle">🎥 วิดีโอคอล</h2>
        <p className="text-tea-milk-dark">เหมือน ome</p>
        <div className="mt-4 inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl shadow animate-pulse font-medium text-lg">
          🚧 ฟีเจอร์นี้กำลังพัฒนาอยู่ 🚧
        </div>
      </div>

      {/* Video Call Option: Random Chat Only */}
      <div className="space-y-4 opacity-50 pointer-events-none select-none">
        <div className="bg-white rounded-2xl shadow-tea-lg p-6 border border-tea-milk-base text-center card-hover animate-in slide-in-from-right duration-500 delay-100">
          <div className="w-16 h-16 bg-gradient-to-br from-tea-milk-medium to-accent-brown rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ animationDelay: '1s' }}>
            <Shuffle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-accent-brown mb-2">สุ่มโทร</h3>
          <p className="text-sm text-tea-milk-dark mb-4">เอากันเข้าไป</p>
          <Button
            onClick={startRandomCall}
            className="bg-gradient-to-r from-tea-milk-medium to-tea-milk-dark text-white py-3 px-6 rounded-xl font-medium hover:shadow-tea-lg hover:scale-105 transform transition-all duration-300"
            disabled
          >
            สุ่มคุย
          </Button>
        </div>
      </div>
    </div>
  );
}
