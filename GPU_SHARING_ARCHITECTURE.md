# VideoGator GPU Sharing Architecture

## How It Works

### Current Setup (Your GPU)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              YOUR NETWORK                                    │
│                                                                              │
│  ┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐ │
│  │  Your Mac       │         │  Your Windows PC │         │  Your Router │ │
│  │  VideoGator UI  │◀───────▶│  Video Server    │◀───────▶│  (Port 8001) │ │
│  │  localhost:3000 │  LAN    │  GPU: RTX 3090   │  LAN    │              │ │
│  └─────────────────┘         └──────────────────┘         └──────────────┘ │
│         │                              │                                     │
│         │                              ▼                                     │
│         │                    ┌──────────────────┐                           │
│         │                    │  Generated Videos│                           │
│         │                    │  (R2 Storage)    │                           │
│         │                    └──────────────────┘                           │
│         │                              │                                     │
└─────────┼──────────────────────────────┼─────────────────────────────────────┘
          │                              │
          │         Internet             │
          │                              │
┌─────────┼──────────────────────────────┼─────────────────────────────────────┐
│         ▼                              ▼                                     │
│  ┌─────────────────┐         ┌──────────────────┐                           │
│  │  Other Users    │         │  Cloudflare R2   │                           │
│  │  (Your Website) │◀───────▶│  Video Storage   │                           │
│  │                 │  CDN    │  (Public URLs)   │                           │
│  └─────────────────┘         └──────────────────┘                           │
│                                                                              │
│                        VIDEOGATOR CLOUD (Vercel)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Question: Do Other Users Use Your GPU?

**YES** - If you deploy VideoGator to the cloud (Vercel), other users will use your Windows GPU for video generation.

Here's how the flow works:

1. **User visits your site** → Vercel serves the frontend
2. **User generates a video** → Request goes to your backend
3. **Backend forwards to your GPU** → Your Windows PC processes it
4. **Video uploads to R2** → Stored in cloud storage
5. **User receives video URL** → Can view/download

### Cost Implications

| Scenario | Your Cost | User Cost |
|----------|-----------|-----------|
| You use it locally | Electricity (~$0.02/video) | Free |
| 10 users generate 100 videos/day | Electricity + bandwidth | Free (if no paywall) |
| With paywall | Electricity | $0.05/video or subscription |

### Recommended Architecture

For a production service with paywall:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION ARCHITECTURE                              │
│                                                                              │
│  ┌─────────────────┐                                                        │
│  │  User Browser   │                                                        │
│  │  (Anywhere)     │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────┐ │
│  │  Vercel         │     │  Your Backend    │     │  Your Windows GPU    │ │
│  │  (Frontend)     │────▶│  (API Server)    │────▶│  (Video Generation)  │ │
│  │  videogator.com │     │  tRPC Routes     │     │  Port 8001 (Tunnel)  │ │
│  └─────────────────┘     └──────────────────┘     └──────────────────────┘ │
│                                   │                        │                │
│                                   ▼                        ▼                │
│                          ┌──────────────────┐     ┌──────────────────────┐ │
│                          │  Database        │     │  Cloudflare R2       │ │
│                          │  (Users, Videos) │     │  (Video Storage)     │ │
│                          └──────────────────┘     └──────────────────────┘ │
│                                   │                        │                │
│                                   ▼                        ▼                │
│                          ┌──────────────────┐     ┌──────────────────────┐ │
│                          │  Stripe          │     │  CDN Distribution    │ │
│                          │  (Payments)      │     │  (Fast Video Access) │ │
│                          └──────────────────┘     └──────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Exposing Your GPU to the Internet

### Option 1: Port Forwarding (Not Recommended)

```
Router Settings:
- External Port: 8001
- Internal IP: 192.168.1.100 (your Windows PC)
- Internal Port: 8001
```

**Security Risk**: Anyone can access your video server.

### Option 2: Cloudflare Tunnel (Recommended)

```bash
# On your Windows PC
cloudflared tunnel --url http://localhost:8001
```

This gives you a secure URL like: `https://your-tunnel.trycloudflare.com`

### Option 3: Tailscale (Best for Personal Use)

```bash
# Install Tailscale on both machines
# Your Mac connects to Windows via Tailscale IP
VIDEO_SERVER_URL=http://100.x.y.z:8001
```

## Paywall Implementation

### Database Schema (Already Added)

```sql
-- User credits/balance
CREATE TABLE user_credits (
  user_id INTEGER PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  purchased_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'purchase', 'usage', 'refund'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Stripe Integration

```typescript
// server/_core/payments.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(userId: number, priceId: string) {
  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/gallery?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/paywall?canceled=true`,
    metadata: { userId: String(userId) },
  });
}

export async function handleWebhook(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = Number(session.metadata.userId);
    // Add credits to user
    await addCreditsToUser(userId, 100);
  }
}
```

### Credit Check Before Generation

```typescript
// In video generation endpoint
async function generateVideo(userId: number, params: GenerateParams) {
  // Check credits
  const credits = await getUserCredits(userId);
  if (credits.balance < 1) {
    throw new TRPCError({
      code: 'PAYMENT_REQUIRED',
      message: 'Insufficient credits. Please purchase more.',
    });
  }
  
  // Deduct credit
  await deductCredit(userId, 1);
  
  // Generate video
  const video = await generateWithGPU(params);
  
  // Store video
  await createVideo({ userId, ...video });
  
  return video;
}
```

## Pricing Recommendations

| Plan | Price | Credits | Per Video |
|------|-------|---------|-----------|
| Free Trial | $0 | 5 videos | $0.00 |
| Pay Per Use | $0.05 | 1 video | $0.05 |
| Starter | $9/mo | 200 videos | $0.045 |
| Pro | $19/mo | 500 videos | $0.038 |
| Enterprise | $99/mo | Unlimited | ~$0.02 |

## Cost Analysis

### Your Costs (GPU Owner)
- Electricity: ~$0.015/video (RTX 3090)
- Internet bandwidth: ~$0.01/video (upload to R2)
- R2 Storage: ~$0.015/GB/month
- **Total**: ~$0.025/video

### Revenue Potential
- At $0.05/video: $0.025 profit per video
- 100 videos/day: $2.50/day = $75/month
- 1000 videos/day: $25/day = $750/month

## Security Considerations

### API Key Authentication

```python
# In video-server/main.py
API_KEY = os.getenv("API_KEY")

@app.middleware("http")
async def verify_api_key(request, call_next):
    if request.url.path.startswith("/generate"):
        api_key = request.headers.get("X-API-Key")
        if api_key != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid API key")
    return await call_next(request)
```

### Rate Limiting

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/generate")
@limiter.limit("10/hour")  # 10 videos per hour per IP
async def generate(request: Request, ...):
    ...
```

## Next Steps

1. **Set up Cloudflare Tunnel** on your Windows PC
2. **Add Stripe integration** for payments
3. **Implement credit system** in the database
4. **Add rate limiting** to prevent abuse
5. **Create user dashboard** for credit management

Would you like me to implement any of these features?
