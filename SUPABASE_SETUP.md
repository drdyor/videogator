# Supabase Setup Guide for VideoGator

This guide walks you through setting up a free Supabase PostgreSQL database for VideoGator.

## Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Verify your email

## Step 2: Create a New Project

1. Click "New Project"
2. Fill in project details:
   - **Name:** videogator (or your preferred name)
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Choose closest to your location
   - **Pricing Plan:** Free tier (perfect for MVP)
3. Click "Create new project"
4. Wait for database to initialize (2-3 minutes)

## Step 3: Get Connection String

1. Go to project settings (gear icon)
2. Click "Database" in left sidebar
3. Under "Connection string", select "PostgreSQL"
4. Copy the full connection string
5. Replace `[YOUR-PASSWORD]` with the password you created

**Connection string format:**
```
postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
```

## Step 4: Set Environment Variable

Add to your `.env` file:
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
```

## Step 5: Run Migrations

```bash
# Generate migrations from schema
pnpm drizzle-kit generate

# Run migrations on Supabase
pnpm drizzle-kit migrate
```

## Step 6: Seed Mock Data (Optional)

The application auto-seeds mock data on first run. If you want to manually seed:

```bash
# Start the dev server
pnpm dev
```

The mock data will be inserted automatically when the server starts.

## Step 7: Verify Connection

Check that tables were created:

1. In Supabase dashboard, go to "SQL Editor"
2. Run this query:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see tables like: `users`, `projects`, `services`, `pharmaTemplates`, etc.

## Free Tier Limits

- **Database:** 500MB storage
- **API calls:** Unlimited
- **Bandwidth:** 2GB/month
- **Connections:** Up to 10 concurrent

This is plenty for MVP testing and small-scale production use.

## Troubleshooting

### Connection Refused
- Check DATABASE_URL is correct
- Verify password is correct
- Ensure SSL mode is enabled (`sslmode=require`)

### Migration Failed
- Check that DATABASE_URL is set
- Verify PostgreSQL version is 12+
- Check for schema conflicts

### Tables Not Created
- Run `pnpm drizzle-kit generate` first
- Then run `pnpm drizzle-kit migrate`
- Check Supabase SQL Editor for any errors

## Next: Deploy to Vercel

Once database is set up, deploy the app to Vercel (free tier):

1. Push code to GitHub
2. Go to [https://vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add `DATABASE_URL` environment variable
5. Deploy!

Your VideoGator app will be live with zero hosting costs.
