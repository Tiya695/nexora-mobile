import { useState } from 'react';
import { useCityStore } from '../stores/cityStore';
import { fetchNearbyInfrastructure, formatInfrastructureForPrompt } from '../lib/osmContext';
import { GEMINI_API_KEY } from '@env';

export interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
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
      text: `🏙️ Hello! I am Nexy, your Smart City AI Assistant for ${cityName}. Tell me the issue and the exact location (e.g. "potholes near Hill Road, Bandra") and I'll suggest a plan.`,
      timestamp: new Date(),
    };

    if (initialComplaint) {
      return [
        defaultMsg,
        {
          id: 'context',
          role: 'agent',
          text: `🔍 Loaded complaint: "${initialComplaint.title}" (${initialComplaint.category}, ${initialComplaint.ward || 'no ward set'}). Can you confirm the exact location/landmark so I can suggest a plan?`,
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

    const hasLocation = /(road|street|lane|avenue|sector|colony|nagar|block|ward|junction|near|at |in )/i.test(fullConversation);

    if (!hasLocation) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: `📍 Could you tell me the specific street, landmark, or area name? I need that to give an accurate plan for ${cityName}.`,
        timestamp: new Date(),
      }]);
      setLoading(false);
      return;
    }

    try {
      let infrastructureContext = '';
      if (complaint?.latitude && complaint?.longitude) {
        const features = await fetchNearbyInfrastructure(complaint.latitude, complaint.longitude);
        infrastructureContext = formatInfrastructureForPrompt(features);
      }

      const conversationHistory = [...messages, userMsg]
        .map(m => `${m.role === 'user' ? 'Citizen' : 'Agent'}: ${m.text}`)
        .join('\n');

      const prompt = `You are a Smart City AI Agent for ${cityName}, Maharashtra, India. Continue this conversation naturally, remembering what was already discussed. Do not repeat the same problem analysis if it was already given — instead answer the citizen's latest message directly.

IMPORTANT: You are a text-only assistant. You CANNOT send emails, register complaints with BMC, or contact anyone. NEVER ask for the citizen's email or phone number, and NEVER claim you will "send" or "email" anything. Instead, tell them to use the app's Report tab to officially submit a complaint, since that is the only real action available.

${infrastructureContext ? `${infrastructureContext}\n\nWhen suggesting any construction or repair plan, you MUST take this real nearby infrastructure into account by name where possible. Do not propose demolishing or routing through existing buildings. If no infrastructure data is available, clearly state your plan is generic and recommend an on-site survey before construction.\n` : ''}

This complaint is specifically in the ${complaint?.ward || 'unspecified'} ward, category "${complaint?.category || 'general'}". Tailor your plan to this exact ward and category combination rather than giving a city-wide generic answer — reference the ward name explicitly in your response.

Conversation so far:
${conversationHistory}

${complaint ? `Linked complaint: ${complaint.title}, category ${complaint.category}.` : ''}

Keep your reply concise, under 150 words, and directly address the citizen's most recent message. Do NOT use markdown formatting like asterisks, bold, or bullet symbols — write in plain text with simple numbered steps using "1." "2." "3." and normal line breaks only.`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
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
      }]);
    } catch (e: any) {
      console.log('Smart city agent call failed:', e.message);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: `⚠️ I couldn't reach the planning service right now (${e.message || 'connection issue'}). Please try again in a moment.`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage };
}