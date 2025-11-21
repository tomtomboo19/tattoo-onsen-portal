-- Run this in Supabase SQL editor

create extension if not exists "pgcrypto";

CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  prefecture text NOT NULL,
  city text,
  address text,
  lat double precision,
  lng double precision,
  tattoo_policy text NOT NULL, -- 'full_ok','cover_ok','time_limited','no'
  description text,
  sauna_types text[],
  water_temp numeric,
  price text,
  open_hours text,
  website text,
  photos text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  reporter text,
  comment text,
  photos text[],
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facilities_pref ON facilities(prefecture);
