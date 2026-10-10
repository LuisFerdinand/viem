CREATE TABLE "automation_presets" (
	"id" text PRIMARY KEY NOT NULL,
	"definition" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"date" date NOT NULL,
	"description" text NOT NULL,
	"counterparty" text DEFAULT '' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "harvests" ADD COLUMN "paid_at" date;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ledger_unit_date_idx" ON "ledger_entries" USING btree ("unit_id","date");
--> statement-breakpoint
UPDATE "harvests" SET "paid_at" = "harvested_at" WHERE "status" = 'paid' AND "paid_at" IS NULL;
