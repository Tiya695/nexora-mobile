# Nexora Mobile

Civic complaint platform for field agents and citizens in Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune. Built with React Native, Supabase, and the Nexy Smart City AI Agent.

## Overview

Nexora lets citizens report civic issues like potholes, water leaks, broken streetlights, garbage — with photos and GPS location. Field agents verify, assign, and resolve complaints with before/after photo evidence. The Nexy AI Agent analyses each complaint using real OpenStreetMap infrastructure data and generates a grounded action plan referencing actual nearby streets and buildings, not generic text.

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
## Project structure

```
src/
├── components/
│   ├── ui/                  
│   ├── BeforeAfterPair.tsx  
│   ├── CitySwitcherSheet.tsx
│   ├── CvSuggestionBanner.tsx
│   ├── InfrastructureMap.tsx 
│   └── PrescriptionCard.tsx
├── hooks/
│   ├── useRealtimeComplaints.ts
│   └── useSmartCityAgent.ts  
├── lib/
│   ├── complaints.ts        
│   ├── geocode.ts            
│   ├── geoTo3d.ts            
│   ├── notifications.ts
│   ├── offlineQueue.ts
│   ├── osmContext.ts         
│   ├── sentry.ts
│   ├── storage.ts
│   ├── supabase.ts
│   ├── syncEngine.ts
│   └── uploadImage.ts       
├── navigation/
│   ├── AppTabs.tsx
│   ├── AuthNavigator.tsx
│   └── RootNavigator.tsx
├── screens/
│   ├── DashboardScreen.tsx
│   ├── LoginScreen.tsx
│   ├── MapScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── ReportScreen.tsx
│   ├── ResolveScreen.tsx
│   └── SmartCityAgentScreen.tsx
├── stores/
│   ├── authStore.ts
│   └── cityStore.ts
└── theme/
    └── tokens.ts             
```
## How the Nexy AI Agent Works

Nexy is the core AI feature. Here is how it works technically:

1. User describes a civic issue with a location (e.g. "potholes near MG Road, Goregaon")
2. The app extracts the location text and geocodes it using Nominatim (free OpenStreetMap geocoding), with a two-attempt fallback strategy and spelling correction
3. Once coordinates are resolved, the app queries the Overpass API to fetch real OSM buildings, roads, and amenities within 300m
4. This real infrastructure data is injected into the Gemini prompt so the AI generates plans that reference actual nearby structures by name — not generic text
5. A real Google Map centered on the geocoded coordinates is displayed alongside the plan, with OSM feature markers.

## Roles

- Citizen: Can report complaints and use the Nexy AI agent. Cannot see the agent dashboard.
- Agent: Full access including the real-time complaint dashboard, resolve screen with before/after photos, and AI agent.

Switch roles in the Profile tab.

Key features
- Real infrastructure context: AI plans reference actual nearby buildings and roads from OpenStreetMap, not invented locations
- Before/after evidence: Field agents capture photos before and after resolving an issue
- Multi-city: Supports Mumbai, Delhi, Bangalore, Chennai, Hyderabad, and Pune with city-aware geocoding
- Real-time dashboard: Complaint list updates live via Supabase Realtime subscriptions
- Offline-first: Complaints submitted without internet are queued locally and synced automatically when connectivity returns

## Notes

Push notifications require a real build rather than Expo Go due to Expo SDK 53 restrictions. The Gemini free tier has rate limits and occasional high-demand errors that resolve on retry. The android and ios folders are excluded from this repo since they are auto-generated — run `npx expo prebuild` to regenerate them.

## License
MIT
