import { uploadImageToSupabase } from './supabase';

export async function sendChatMessage(messages: Array<{ role: string; content: string }>) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Chat API error:', error);
    throw new Error('Failed to get response from teaching assistant');
  }
}

export async function uploadImage(file: File): Promise<string> {
  try {
    // Use Supabase storage instead of direct API call
    const url = await uploadImageToSupabase(file);
    return url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
