CREATE TABLE "hubs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"site" text NOT NULL,
	"location" text NOT NULL,
	"municipality" text NOT NULL,
	"installed_at" date NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "hub_id" text;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "preset_id" text DEFAULT 'aquaponics-tilapia' NOT NULL;--> statement-breakpoint
-- Every existing unit becomes the first set of a hub with the same id and details.
INSERT INTO "hubs" ("id", "name", "kind", "site", "location", "municipality", "installed_at", "sort_order", "created_at")
SELECT "id", "name", "kind", "site", "location", "municipality", "installed_at", "sort_order", "created_at" FROM "units";--> statement-breakpoint
UPDATE "units" SET "hub_id" = "id", "name" = 'Set 1';--> statement-breakpoint
ALTER TABLE "units" ALTER COLUMN "hub_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_hub_id_hubs_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "units_hub_idx" ON "units" USING btree ("hub_id");
