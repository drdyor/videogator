import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface GeneratingAnimationProps {
  prompt?: string;
  progress?: number;
  estimatedTime?: number;
}

export default function GeneratingAnimation({ 
  prompt, 
  progress = 0,
  estimatedTime 
}: GeneratingAnimationProps) {
  return (
    <Card className="p-8 text-center space-y-6 bg-gradient-to-b from-green-50 to-white border-green-200">
      {/* Alligator Typing Animation */}
      <div className="relative w-48 h-48 mx-auto">
        {/* Oscars Falling Animation */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${15 + i * 15}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            >
              <svg
                viewBox="0 0 24 36"
                className="w-6 h-9 text-yellow-400 drop-shadow-lg"
                fill="currentColor"
              >
                {/* Oscar statue */}
                <ellipse cx="12" cy="6" rx="5" ry="6" className="fill-yellow-500" />
                <rect x="10" y="12" width="4" height="8" className="fill-yellow-400" />
                <rect x="8" y="20" width="8" height="4" className="fill-yellow-500" />
                <rect x="6" y="24" width="12" height="12" rx="1" className="fill-yellow-400" />
              </svg>
            </div>
          ))}
        </div>

        {/* Alligator SVG */}
        <svg
          viewBox="0 0 200 150"
          className="w-full h-full relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body */}
          <ellipse cx="100" cy="100" rx="70" ry="35" className="fill-green-700" />
          
          {/* Head */}
          <ellipse cx="170" cy="85" rx="30" ry="20" className="fill-green-700" />
          
          {/* Snout */}
          <ellipse cx="195" cy="90" rx="15" ry="10" className="fill-green-600" />
          
          {/* Eye */}
          <circle cx="175" cy="75" r="5" className="fill-yellow-400" />
          <circle cx="176" cy="74" r="2" className="fill-black" />
          
          {/* Teeth */}
          <path d="M185 95 L188 100 L191 95 L194 100 L197 95" className="stroke-white stroke-2 fill-none" />
          
          {/* Typing Arms - Animated */}
          <g className="animate-type">
            {/* Left arm */}
            <path d="M60 90 L40 110 L35 105" className="stroke-green-800 stroke-6 fill-none stroke-linecap-round stroke-linejoin-round">
              <animate
                attributeName="d"
                values="M60 90 L40 110 L35 105;M60 90 L40 115 L35 110;M60 90 L40 110 L35 105"
                dur="0.3s"
                repeatCount="indefinite"
              />
            </path>
            {/* Right arm */}
            <path d="M80 85 L60 105 L55 100" className="stroke-green-800 stroke-6 fill-none stroke-linecap-round stroke-linejoin-round">
              <animate
                attributeName="d"
                values="M80 85 L60 105 L55 100;M80 85 L60 110 L55 105;M80 85 L60 105 L55 100"
                dur="0.3s"
                repeatCount="indefinite"
                begin="0.15s"
              />
            </path>
          </g>
          
          {/* Keyboard */}
          <rect x="30" y="115" width="50" height="15" rx="2" className="fill-gray-300" />
          <rect x="35" y="118" width="8" height="5" className="fill-gray-400" />
          <rect x="45" y="118" width="8" height="5" className="fill-gray-400" />
          <rect x="55" y="118" width="8" height="5" className="fill-gray-400" />
          <rect x="65" y="118" width="8" height="5" className="fill-gray-400" />
          
          {/* Belly */}
          <ellipse cx="100" cy="110" rx="50" ry="20" className="fill-green-500" />
          
          {/* Scales pattern */}
          <circle cx="70" cy="95" r="3" className="fill-green-800 opacity-50" />
          <circle cx="90" cy="90" r="3" className="fill-green-800 opacity-50" />
          <circle cx="110" cy="95" r="3" className="fill-green-800 opacity-50" />
          <circle cx="130" cy="90" r="3" className="fill-green-800 opacity-50" />
        </svg>
      </div>

      {/* Processing Text */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-green-800 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Generating Your Video...
        </h3>
        
        {prompt && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto line-clamp-2">
            "{prompt}"
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="w-full max-w-xs mx-auto">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Processing</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-green-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Estimated Time */}
      {estimatedTime && (
        <p className="text-xs text-muted-foreground">
          Estimated time: ~{estimatedTime} seconds
        </p>
      )}

      {/* Fun Messages */}
      <div className="text-sm text-green-700 animate-pulse">
        {getFunMessage(progress)}
      </div>
    </Card>
  );
}

function getFunMessage(progress: number): string {
  const messages = [
    "🐊 Gator is typing furiously...",
    "✨ Sprinkling Oscar magic...",
    "🎬 Directing the scene...",
    "🌟 Adding Hollywood polish...",
    "🎥 Rolling cameras...",
    "🏆 Almost ready for the awards!",
  ];
  
  const index = Math.min(Math.floor(progress / 20), messages.length - 1);
  return messages[index];
}

// CSS for falling animation (add to index.css)
// @keyframes fall {
//   0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
//   10% { opacity: 1; }
//   100% { transform: translateY(200px) rotate(360deg); opacity: 0; }
// }
// .animate-fall { animation: fall 3s linear infinite; }
