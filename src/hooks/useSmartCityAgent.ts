import { useState } from 'react';
import { useCityStore } from '../stores/cityStore';
import { fetchNearbyInfrastructure, formatInfrastructureForPrompt } from '../lib/osmContext';
import { geocodeLocation } from '../lib/geocode';
import { buildSceneFromFeatures, SceneObject } from '../lib/geoTo3d';
import { GEMINI_API_KEY } from '@env';

export interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
  sceneObjects?: SceneObject[];
  latitude?: number;
  longitude?: number;
  features?: any[];
}

export function useSmartCityAgent(initialComplaint?: any) {
  const activeCityId = useCityStore.getState().activeCity;
  const citiesList = useCityStore.getState().cities;
  const currentCityObj = citiesList.find(c => c.id === activeCityId);
  const cityName = currentCityObj ? currentCityObj.label : 'Mumbai';

  const [messages, setMessages] = useState<Message[]>(() => {
    const defaultMsg: Message = {
      id: '1',
      role: 'agent',
      text: `🏙️ Hello! I am Nexy, your Smart City AI Assistant for ${cityName}. Tell me the issue and the exact location (e.g. "potholes near Hill Road, Bandra") and I will suggest a plan.`,
      timestamp: new Date(),
    };

    if (initialComplaint) {
      return [
        defaultMsg,
        {
          id: 'context',
          role: 'agent',
          text: `🔍 Loaded complaint: "${initialComplaint.title}" (${initialComplaint.category}, ${initialComplaint.ward || 'no ward set'}). Can you confirm the exact location or landmark so I can suggest a plan?`,
          timestamp: new Date(),
        }
      ];
    }

    return [defaultMsg];
  });

  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string, complaint?: any) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const fullConversation = [...messages, userMsg]
      .filter(m => m.role === 'user')
      .map(m => m.text)
      .join(' ');

    const hasLocation = /(road|street|lane|avenue|sector|colony|nagar|block|ward|junction|near|at |in |marg|chowk|bazar|bazaar)/i.test(fullConversation);

    if (!hasLocation) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: `📍 Please specify which street, road, or landmark you are referring to so I can give you an accurate plan for ${cityName}.`,
        timestamp: new Date(),
      }]);
      setLoading(false);
      return;
    }

    try {
      let infrastructureContext = '';
      let sceneObjects: SceneObject[] = [];
      let resolvedLat = complaint?.latitude;
      let resolvedLng = complaint?.longitude;
      let resolvedFeatures: any[] = [];
      let geocodeFailed = false;

      if (!resolvedLat || !resolvedLng) {
        const locationMatch = text.match(/(?:near|at|in|on)\s+([a-zA-Z0-9\s]+?)(?:\.|,|$)/i)
          || text.match(/([a-zA-Z\s]+(?:road|rd|marg|lane|nagar|chowk|street|st))/i);

        const locationQuery = locationMatch ? locationMatch[1].trim() : text.trim();
        console.log('Geocoding:', locationQuery);
        const geocoded = await geocodeLocation(locationQuery, cityName);

        if (geocoded) {
          resolvedLat = geocoded.lat;
          resolvedLng = geocoded.lng;
          console.log('Geocoded to:', resolvedLat, resolvedLng);
        } else {
          geocodeFailed = true;
          console.log('Geocoding failed for:', locationQuery);
        }
      }

      if (resolvedLat && resolvedLng) {
        console.log('Fetching OSM data for', resolvedLat, resolvedLng);
        const features = await fetchNearbyInfrastructure(resolvedLat, resolvedLng);
        resolvedFeatures = features;
        console.log('OSM features found:', features.length);
        infrastructureContext = formatInfrastructureForPrompt(features);
        sceneObjects = buildSceneFromFeatures(resolvedLat, resolvedLng, features);
      }

      const conversationHistory = [...messages, userMsg]
        .map(m => `${m.role === 'user' ? 'Citizen' : 'Agent'}: ${m.text}`)
        .join('\n');

      const prompt = `You are Nexy, a Smart City AI Agent for ${cityName}, India.

RULES:
- Write in plain text only. No asterisks or markdown symbols.
- If the citizen misspells a location, interpret it intelligently and proceed.
- You cannot send emails or register complaints directly. Never ask for email or phone.
- Write exactly 3 numbered action steps. Each step is one short sentence under 20 words. Complete all 3 steps fully.
- Every sentence must end with a full stop.
- Use real street or building names from the OSM data below if available.
- After step 3, write this exact sentence: "Use the Report tab in this app to submit your complaint officially."
- Do not write anything after that final sentence.

${infrastructureContext ? `Nearby infrastructure from OpenStreetMap:\n${infrastructureContext}\n` : ''}
${geocodeFailed ? `Note: Location could not be precisely mapped. Use general area context.\n` : ''}

Ward: ${complaint?.ward || 'general area'}
Category: ${complaint?.category || 'general'}

Conversation:
${conversationHistory}

${complaint ? `Complaint: ${complaint.title}, ${complaint.category}.` : ''}

Write steps 1, 2, 3 then the Report tab sentence. Complete all 3 steps:`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            ],
          }),
        }
      );

      const data = await geminiRes.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!answer) {
        throw new Error(data?.error?.message || 'No answer returned');
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: answer,
        timestamp: new Date(),
        sceneObjects: sceneObjects.length > 0 ? sceneObjects : undefined,
        latitude: resolvedLat,
        longitude: resolvedLng,
        features: resolvedFeatures.length > 0 ? resolvedFeatures : undefined,
      }]);

    } catch (e: any) {
      console.log('Smart city agent call failed:', e.message);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: `⚠️ Could not reach the planning service right now. Please try again in a moment.`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage };
}