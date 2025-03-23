const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function sendChatMessage(messages: Array<{ role: string; content: string }>) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat`, {
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
    const formData = new FormData();
    formData.append('image', file);

    // Update the URL to match server endpoint (remove /v1/ prefix)
    const response = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image');
  }
}
