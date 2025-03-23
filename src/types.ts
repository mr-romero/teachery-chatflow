// Add chatbotEnabled property to the Slide interface
export interface Slide {
  id: string;
  title: string;
  content: SlideContent;
  goals: Goal[];
  chatbotEnabled?: boolean; // Add this property
}

// ...existing code...
