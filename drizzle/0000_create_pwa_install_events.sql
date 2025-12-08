CREATE TABLE IF NOT EXISTS "pwa_install_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_type" varchar(40) NOT NULL,
  "user_id" varchar(255),
  "triggered_by" varchar(64),
  "install_surface" varchar(64),
  "platform" varchar(128),
  "user_agent" varchar(512),
  "is_standalone" boolean,
  "metadata" jsonb,
  "occurred_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "pwa_install_events_event_type_idx"
  ON "pwa_install_events" ("event_type");

CREATE INDEX IF NOT EXISTS "pwa_install_events_user_idx"
  ON "pwa_install_events" ("user_id");

CREATE INDEX IF NOT EXISTS "pwa_install_events_occurred_idx"
  ON "pwa_install_events" ("occurred_at");
