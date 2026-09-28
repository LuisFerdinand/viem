CREATE TABLE "actuators" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"kind" text NOT NULL,
	"mode" text DEFAULT 'manual' NOT NULL,
	"is_on" boolean DEFAULT false NOT NULL,
	"schedule_on_min" integer DEFAULT 15 NOT NULL,
	"schedule_off_min" integer DEFAULT 45 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text DEFAULT 'System' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"code" text NOT NULL,
	"severity" text NOT NULL,
	"value" real NOT NULL,
	"message_tet" text NOT NULL,
	"message_en" text NOT NULL,
	"channel" text DEFAULT 'whatsapp' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by" text,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"actuator" text NOT NULL,
	"sensor" text NOT NULL,
	"condition" text NOT NULL,
	"on_value" real NOT NULL,
	"off_value" real NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" text,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "harvests" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"crop" text NOT NULL,
	"category" text NOT NULL,
	"weight_kg" real NOT NULL,
	"price_per_kg" real NOT NULL,
	"buyer" text NOT NULL,
	"status" text DEFAULT 'logged' NOT NULL,
	"harvested_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thresholds" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"sensor" text NOT NULL,
	"min" real NOT NULL,
	"max" real NOT NULL,
	"critical_min" real NOT NULL,
	"critical_max" real NOT NULL,
	"alarm_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"site" text NOT NULL,
	"location" text NOT NULL,
	"municipality" text NOT NULL,
	"crops" text NOT NULL,
	"fish_count" integer NOT NULL,
	"tank_liters" integer NOT NULL,
	"operator_team" integer NOT NULL,
	"installed_at" date NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "actuators" ADD CONSTRAINT "actuators_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thresholds" ADD CONSTRAINT "thresholds_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "actuators_unit_kind_idx" ON "actuators" USING btree ("unit_id","kind");--> statement-breakpoint
CREATE INDEX "alerts_unit_idx" ON "alerts" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "alerts_created_idx" ON "alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "rules_unit_idx" ON "automation_rules" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "events_created_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "harvests_unit_idx" ON "harvests" USING btree ("unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "thresholds_unit_sensor_idx" ON "thresholds" USING btree ("unit_id","sensor");