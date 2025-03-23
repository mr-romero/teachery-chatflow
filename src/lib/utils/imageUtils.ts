/**
 * Utility functions for handling images
 */

// Check if a URL is a valid image
export async function isValidImageUrl(url: string): Promise<boolean> {
  // Skip empty urls
  if (!url) return false;
  
  // For base64 images, we assume they're valid
  if (url.startsWith('data:image/')) return true;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) return false;
    
    const contentType = response.headers.get('content-type');
    return contentType ? contentType.startsWith('image/') : false;
  } catch (error) {
    console.error('Error validating image URL:', error);
    return false;
  }
}

// Get a placeholder for failed images
export function getImagePlaceholder(): string {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMgOUgxMVYxMUgxM1Y5WiIgZmlsbD0iY3VycmVudENvbG9yIi8+PHBhdGggZD0iTTEzIDEzSDExVjE3SDEzVjEzWiIgZmlsbD0iY3VycmVudENvbG9yIi8+PHBhdGggZD0iTTEyIDIwQzE2LjQxODMgMjAgMjAgMTYuNDE4MyAyMCAxMkMyMCA3LjU4MTcyIDE2LjQxODMgNCAxMiA0QzcuNTgxNzIgNCA0IDcuNTgxNzIgNCAxMkM0IDE2LjQxODMgNy41ODE3MiAyMCAxMiAyMFpNMTIgMjJDNi40NzcxNyAyMiAyIDE3LjUyMjggMiAxMkMyIDYuNDc3MTcgNi40NzcxNyAyIDEyIDJDMTcuNTIyOCAyIDIyIDYuNDc3MTcgMjIgMTJDMjIgMTcuNTIyOCAxNy41MjI4IDIyIDEyIDIyWiIgZmlsbD0iY3VycmVudENvbG9yIi8+PC9zdmc+';
}

// Resize image to max dimensions if needed
export function resizeImage(file: File, maxWidth = 1200, maxHeight = 1200): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Only resize if the image exceeds the max dimensions
      if (img.width <= maxWidth && img.height <= maxHeight) {
        resolve(file);
        return;
      }
      
      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = img.width;
      let newHeight = img.height;
      
      if (newWidth > maxWidth) {
        newHeight = (maxWidth / newWidth) * newHeight;
        newWidth = maxWidth;
      }
      
      if (newHeight > maxHeight) {
        newWidth = (maxHeight / newHeight) * newWidth;
        newHeight = maxHeight;
      }
      
      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert back to file
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }
        
        const newFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        
        resolve(newFile);
      }, file.type);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
