CREATE TYPE "public"."video_status" AS ENUM('processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "savedPrompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"prompt" text NOT NULL,
	"negativePrompt" text,
	"model" varchar(50),
	"settings" text,
	"isFavorite" integer DEFAULT 0 NOT NULL,
	"useCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"jobId" varchar(64),
	"prompt" text NOT NULL,
	"negativePrompt" text,
	"model" varchar(50) NOT NULL,
	"width" integer,
	"height" integer,
	"numFrames" integer,
	"fps" integer,
	"seed" integer,
	"videoUrl" text NOT NULL,
	"thumbnailUrl" text,
	"durationSeconds" integer,
	"fileSizeBytes" integer,
	"status" "video_status" DEFAULT 'completed' NOT NULL,
	"isPublic" integer DEFAULT 0 NOT NULL,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
