CREATE TYPE "public"."membershipstatus" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."membershiptype" AS ENUM('regular', 'supporting');--> statement-breakpoint
CREATE TABLE "membership_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"birth_date" date NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"street" varchar(255) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"city" varchar(100) NOT NULL,
	"country" varchar(100) NOT NULL,
	"iban" varchar(34) NOT NULL,
	"bic" varchar(11),
	"account_holder" varchar(255) NOT NULL,
	"membership_type" "membershiptype" DEFAULT 'regular' NOT NULL,
	"signature_data" text,
	"signature_timestamp" timestamp,
	"signature_ip" varchar(45),
	"status" "membershipstatus" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
