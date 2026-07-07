-- Local relational schema draft for App Competitive Intelligence Dashboard.
-- The MVP implementation uses data/app-state.json through repository interfaces,
-- while these tables document the PostgreSQL migration shape.

create table if not exists projects (
  id text primary key,
  name text not null,
  market text not null,
  languages text[] not null,
  default_watch_frequency text not null,
  created_at timestamptz not null
);

create table if not exists owned_apps (
  id text primary key,
  project_id text not null references projects(id),
  name text not null,
  category text not null,
  owner text not null,
  platforms text[] not null,
  status text not null,
  feature_template text not null,
  website_url text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists competitors (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  name text not null,
  category text not null,
  priority text not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists channels (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  owner_type text not null,
  owner_id text not null,
  channel_name text not null,
  store_url text not null,
  collection_mode text not null,
  compliance_status text not null,
  crawl_status text not null,
  last_failure_reason text,
  last_success_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists evidence (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  source_type text not null,
  source_url text not null,
  channel_name text not null,
  raw_excerpt text not null,
  captured_at timestamptz not null
);

create table if not exists app_snapshots (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  competitor_id text references competitors(id),
  channel_id text not null references channels(id),
  version text,
  rating numeric,
  review_count integer,
  price_text text,
  description text,
  release_notes text,
  screenshots text[] not null,
  captured_at timestamptz not null,
  evidence_id text not null references evidence(id)
);

create table if not exists reviews (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  competitor_id text references competitors(id),
  channel_id text not null references channels(id),
  rating integer not null,
  version text,
  content text not null,
  topic_hint text,
  captured_at timestamptz not null,
  evidence_id text not null references evidence(id)
);

create table if not exists insights (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  category text not null,
  title text not null,
  summary text not null,
  evidence_ids text[] not null,
  confidence numeric not null,
  severity text not null,
  source_channels text[] not null,
  recommendation text not null,
  label text not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists features (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  name text not null,
  category text not null,
  current_app_support text not null,
  competitor_support jsonb not null,
  demand_score integer not null,
  source text not null,
  updated_at timestamptz not null
);

create table if not exists social_samples (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  competitor_id text references competitors(id),
  platform text not null,
  url text not null,
  topic text not null,
  author text,
  published_at text,
  engagement_text text,
  summary text not null,
  tags text[] not null,
  signal_type text not null,
  impact text not null,
  fetch_status text not null,
  fetch_failure_reason text,
  fetched_title text,
  fetched_excerpt text,
  final_url text,
  evidence_id text references evidence(id),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists social_auth_configs (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  platform text not null,
  app_id text,
  client_key text,
  client_secret_configured boolean not null,
  redirect_uri text not null,
  scopes text[] not null,
  status text not null,
  enabled boolean not null,
  crawl_frequency text not null,
  daily_quota integer not null,
  used_today integer not null,
  quota_reset_at timestamptz,
  last_authorization_url text,
  last_auth_url_generated_at timestamptz,
  authorization_code_received boolean not null,
  last_authorized_at timestamptz,
  token_expires_at timestamptz,
  last_failure_reason text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (owned_app_id, platform)
);

create table if not exists feature_gap_details (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  feature_id text not null references features(id),
  feature_name text not null,
  category text not null,
  current_app_support text not null,
  decision text not null,
  demand_score integer not null,
  suggested_action text not null,
  own_evidence_ids text[] not null,
  competitor_details jsonb not null,
  social_evidence_ids text[] not null,
  review_summary text not null,
  total_evidence_count integer not null,
  updated_at timestamptz not null,
  unique (owned_app_id, feature_id)
);

create table if not exists competitor_module_analyses (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  competitor_id text not null references competitors(id),
  period_start date not null,
  period_end date not null,
  module_type text not null,
  summary text not null,
  signals text[] not null,
  risks text[] not null,
  opportunities text[] not null,
  recommendation text not null,
  evidence_ids text[] not null,
  confidence numeric not null,
  data_coverage text[] not null,
  updated_at timestamptz not null,
  unique (owned_app_id, competitor_id, module_type, period_start, period_end)
);

create table if not exists action_recommendations (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  source_key text not null,
  title text not null,
  area text not null,
  action_type text not null,
  owner_role text not null,
  priority_hint text not null,
  impact_score integer not null,
  effort text not null,
  confidence numeric not null,
  problem text not null,
  why_now text not null,
  recommendation text not null,
  implementation_hint text not null,
  success_metric text not null,
  competitor_ids text[] not null,
  feature_ids text[] not null,
  insight_ids text[] not null,
  evidence_ids text[] not null,
  source_modules text[] not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (owned_app_id, source_key)
);

create table if not exists competitive_timeline_events (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  event_type text not null,
  owner_type text not null,
  owner_id text not null,
  owner_name text not null,
  competitor_id text references competitors(id),
  channel_name text,
  platform text,
  title text not null,
  summary text not null,
  impact text not null,
  evidence_ids text[] not null,
  occurred_at timestamptz not null
);

create table if not exists price_signals (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  owner_type text not null,
  owner_id text not null,
  owner_name text not null,
  competitor_id text references competitors(id),
  channel_name text not null,
  platform text,
  price_text text not null,
  numeric_prices text[] not null,
  change_type text not null,
  previous_price_text text,
  evidence_ids text[] not null,
  captured_at timestamptz not null
);

create table if not exists evidence_diffs (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  owner_type text not null,
  owner_id text not null,
  owner_name text not null,
  competitor_id text references competitors(id),
  channel_name text not null,
  platform text,
  field text not null,
  before_value text not null,
  after_value text not null,
  screenshot_urls text[] not null,
  evidence_ids text[] not null,
  changed_at timestamptz not null
);

create table if not exists competitive_alerts (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  alert_type text not null,
  severity text not null,
  title text not null,
  summary text not null,
  owner_type text,
  owner_id text,
  owner_name text,
  competitor_id text references competitors(id),
  evidence_ids text[] not null,
  recommendation_ids text[] not null,
  created_at timestamptz not null
);

create table if not exists store_metadata_signals (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  owner_type text not null,
  owner_id text not null,
  owner_name text not null,
  competitor_id text references competitors(id),
  channel_name text not null,
  platform text,
  field text not null,
  before_value text,
  after_value text not null,
  keyword_hints text[] not null,
  screenshot_urls text[] not null,
  evidence_ids text[] not null,
  captured_at timestamptz not null
);

create table if not exists rating_sentiment_signals (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  owner_type text not null,
  owner_id text not null,
  owner_name text not null,
  competitor_id text references competitors(id),
  channel_name text not null,
  platform text,
  rating numeric,
  review_count integer,
  sample_size integer not null,
  average_review_rating numeric,
  positive_review_count integer not null,
  negative_review_count integer not null,
  risk_level text not null,
  top_themes text[] not null,
  summary text not null,
  evidence_ids text[] not null,
  captured_at timestamptz not null
);

create table if not exists aso_keyword_opportunities (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  keyword text not null,
  source text not null,
  owned_coverage boolean not null,
  competitor_coverage jsonb not null,
  mention_count integer not null,
  opportunity_score integer not null,
  recommendation text not null,
  evidence_ids text[] not null,
  updated_at timestamptz not null,
  unique (owned_app_id, keyword)
);

create table if not exists launch_signals (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  signal_type text not null,
  owner_type text not null,
  owner_id text not null,
  owner_name text not null,
  competitor_id text references competitors(id),
  title text not null,
  summary text not null,
  impact text not null,
  confidence numeric not null,
  source_channels text[] not null,
  evidence_ids text[] not null,
  occurred_at timestamptz not null
);

create table if not exists requirement_candidates (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  insight_ids text[] not null,
  problem text not null,
  evidence_ids text[] not null,
  competitor_reference text not null,
  app_gap_or_advantage text not null,
  recommendation text not null,
  priority_hint text not null,
  prd_notes text not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists reports (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  period_start date not null,
  period_end date not null,
  markdown text not null,
  status text not null,
  evidence_ids text[] not null,
  generated_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists jobs (
  id text primary key,
  owned_app_id text not null references owned_apps(id),
  type text not null,
  state text not null,
  idempotency_key text not null,
  progress integer not null,
  user_message text not null,
  error_code text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null,
  unique (owned_app_id, type, idempotency_key)
);
