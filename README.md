# Nexora Mobile

Civic complaint platform for field agents and citizens in Mumbai and Maharashtra. Built with React Native, Supabase, and the Nexy Smart City AI Agent.

## Overview

Nexora lets citizens report civic issues — potholes, water leaks, broken streetlights, garbage — with photos and GPS location. Field agents verify, assign, and resolve complaints with before/after photo evidence. The Nexy AI Agent analyses each complaint using real OpenStreetMap infrastructure data and generates a grounded action plan referencing actual nearby streets and buildings, not generic text.

## Tech Stack

React Native with Expo SDK 54 (bare workflow), TypeScript, Supabase for auth and database, Zustand for state, Cloudinary for photo uploads, Google Maps via react-native-maps, Google Gemini for AI, OpenStreetMap Overpass API for real infrastructure data, Nominatim for geocoding, Sentry for crash reporting.

## Getting Started

You need Node.js 18+, Android Studio, and Java 17 (Eclipse Temurin recommended).

Clone the repo and install dependencies:

```
git clone https://github.com/Tiya695/nexora-mobile.git
cd nexora-mobile
npm install
```

Create a `.env` file in the project root with these values:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name
GEMINI_API_KEY=your_google_gemini_api_key
```

Get your Supabase credentials from supabase.com under Settings > API. Get your Gemini key from aistudio.google.com. For Cloudinary, create an unsigned upload preset named `nexora` under Settings > Upload > Upload Presets.

Run this SQL in your Supabase SQL Editor to create the complaints table:

```sql
CREATE TABLE complaints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  title text NOT NULL,
  description text,
  category text,
  city text,
  ward text,
  severity text DEFAULT 'medium',
  status text DEFAULT 'submitted',
  photo_url text,
  after_photo_url text,
  latitude float,
  longitude float,
  created_at timestamp DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON complaints FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
```

To run using Expo Go on your Android device:

```
npx expo start --clear --host lan
```

To build natively for Android:

```
npx expo prebuild --platform android
npx expo run:android
```

## How the Nexy AI Agent Works

When a user describes an issue with a location, the app geocodes the location text using Nominatim with a two-attempt fallback and basic spelling correction. Once coordinates are resolved, it queries the Overpass API to fetch real OSM buildings, roads, and amenities within 300 metres. That real infrastructure data is injected into the Gemini prompt so the plan references actual nearby structures by name. A Google Map centred on the resolved coordinates is displayed alongside the plan. The agent works both from a specific linked complaint (using saved GPS coordinates) and from the standalone Nexy tab (geocoding from the typed message).

## Roles

Citizens can report complaints and use the Nexy AI agent. Field agents have full access including the real-time dashboard, the resolve screen with before/after photos, and the AI agent. Switch roles in the Profile tab.

## Notes

Push notifications require a real build rather than Expo Go due to Expo SDK 53 restrictions. The Gemini free tier has rate limits and occasional high-demand errors that resolve on retry. The android and ios folders are excluded from this repo since they are auto-generated — run `npx expo prebuild` to regenerate them.

## License
MIT
