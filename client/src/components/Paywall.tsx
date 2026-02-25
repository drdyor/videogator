import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Zap, 
  Video, 
  Sparkles, 
  Check, 
  Lock,
  CreditCard,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PaywallProps {
  onAccessGranted?: () => void;
}

export default function Paywall({ onAccessGranted }: PaywallProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Check if user has access
  const accessQuery = trpc.video.serverHealth.useQuery();

  const handlePurchase = async () => {
    setIsProcessing(true);
    // TODO: Integrate with Stripe
    // For now, simulate a purchase flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    alert("Payment integration coming soon! For now, enjoy free access during beta.");
    onAccessGranted?.();
  };

  const features = [
    { icon: Video, text: "Unlimited video generation" },
    { icon: Sparkles, text: "5 AI video models included" },
    { icon: Zap, text: "GPU-accelerated processing" },
    { icon: Crown, text: "Priority queue access" },
  ];

  const plans = [
    {
      name: "Pay Per Video",
      price: "$0.05",
      period: "per video",
      description: "Perfect for trying out",
      features: ["No subscription", "Pay only what you use", "All models included"],
      popular: false,
    },
    {
      name: "Pro Monthly",
      price: "$19",
      period: "/month",
      description: "Best for creators",
      features: ["500 videos/month", "Priority processing", "No watermarks", "Commercial license"],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For teams & businesses",
      features: ["Unlimited videos", "Dedicated GPU", "API access", "Custom models"],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Alligator Bouncer */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            {/* Alligator SVG */}
            <svg
              viewBox="0 0 200 150"
              className="w-48 h-36 mx-auto"
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
              {/* Arms */}
              <path d="M60 90 L40 70 L50 65" className="stroke-green-800 stroke-4 fill-none stroke-linecap-round" />
              <path d="M80 85 L60 65 L70 60" className="stroke-green-800 stroke-4 fill-none stroke-linecap-round" />
              {/* Belly */}
              <ellipse cx="100" cy="110" rx="50" ry="20" className="fill-green-500" />
              {/* Scales pattern */}
              <circle cx="70" cy="95" r="3" className="fill-green-800 opacity-50" />
              <circle cx="90" cy="90" r="3" className="fill-green-800 opacity-50" />
              <circle cx="110" cy="95" r="3" className="fill-green-800 opacity-50" />
              <circle cx="130" cy="90" r="3" className="fill-green-800 opacity-50" />
            </svg>
            
            {/* Speech bubble */}
            <div className="absolute -top-2 right-0 bg-white rounded-xl p-3 shadow-lg border-2 border-green-500 transform rotate-3">
              <p className="text-sm font-bold text-green-700">Hold up! 🐊</p>
              <p className="text-xs text-muted-foreground">You gotta pay to play!</p>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold">
            <span className="text-green-600">Video</span>Gator
          </h1>
          <p className="text-xl text-muted-foreground">
            Generate stunning AI videos with your local GPU
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <Card key={i} className="p-4 text-center">
              <feature.icon className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">{feature.text}</p>
            </Card>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <Card 
              key={i} 
              className={`relative p-6 ${plan.popular ? 'border-green-500 border-2 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={handlePurchase}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
              </Button>
            </Card>
          ))}
        </div>

        {/* Beta Notice */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">🎉 Beta Access Active!</p>
              <p className="text-sm text-green-700">
                VideoGator is currently in beta. Enjoy free unlimited video generation while we finalize our payment system.
              </p>
            </div>
          </div>
        </Card>

        {/* GPU Info */}
        {accessQuery.data?.available && (
          <div className="text-center text-sm text-muted-foreground">
            <p>
              GPU Server: <Badge variant="outline" className="ml-1">Online</Badge>
              {' '}• Model: {(accessQuery.data as any)?.device === 'cuda' ? 'NVIDIA GPU' : 'CPU'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
