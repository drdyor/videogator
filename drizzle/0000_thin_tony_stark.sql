CREATE TYPE "public"."alert_level" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('general', 'pharma', 'specialized');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "adminSettings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" "alert_level" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"jobId" varchar(64),
	"userId" integer,
	"error" text,
	"action" text,
	"costCents" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featureFlags" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"enabled" integer DEFAULT 1 NOT NULL,
	"description" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"inputUrl" text NOT NULL,
	"operations" text NOT NULL,
	"currentStep" integer DEFAULT 0 NOT NULL,
	"outputUrl" text,
	"stepResults" text,
	"error" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "pharmaTemplates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(128) NOT NULL,
	"parameters" text,
	"previewImage" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricingRules" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"costCents" integer DEFAULT 0 NOT NULL,
	"priceCents" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"serviceId" varchar(64) NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"prompt" text,
	"settings" text,
	"videoUrl" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "category" DEFAULT 'general' NOT NULL,
	"description" text,
	"capabilities" text,
	"pricing" varchar(255),
	"website" varchar(512),
	"icon" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"encryptedApiKeys" text,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
