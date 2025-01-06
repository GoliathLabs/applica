DO $$ BEGIN
 CREATE TYPE "public"."applicationstatus" AS ENUM('pending', 'accepted', 'declined');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"course_id" integer NOT NULL,
	"experience" varchar,
	"status" "applicationstatus" DEFAULT 'pending' NOT NULL,
	"messaged" boolean DEFAULT false,
	"talked" boolean DEFAULT false,
	"club_briefed" boolean DEFAULT false,
	"security_briefed" boolean DEFAULT false,
	"information" varchar,
	"created" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "applications_fields" (
	"application_id" integer NOT NULL,
	"field_id" integer NOT NULL,
	CONSTRAINT "applications_fields_application_id_field_id_pk" PRIMARY KEY("application_id","field_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications_fields" ADD CONSTRAINT "applications_fields_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications_fields" ADD CONSTRAINT "applications_fields_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
