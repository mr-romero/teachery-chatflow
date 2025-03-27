const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin.includes('localhost') 
  ? 'http://localhost:3000'
  : window.location.origin; // Use the origin of the current page if not on localhost

// Generic API client with common methods
const api = {
  async get(path: string) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      status: response.status,
      data: await response.json()
    };
  },
  
  async post(path: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      status: response.status,
      data: await response.json()
    };
  },
  
  async delete(path: string) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      status: response.status,
      data: await response.json()
    };
  }
};

export { api };
export default api;

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

    // Use API_BASE_URL instead of hardcoded localhost
    const response = await fetch(`${API_BASE_URL}/upload`, {
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
