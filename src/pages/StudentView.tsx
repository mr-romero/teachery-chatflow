
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import SlideViewer, { SlideContent } from '@/components/ui/SlideViewer';
import ChatWindow from '@/components/ui/ChatWindow';
import GoalTracker from '@/components/ui/GoalTracker';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// More reliable demo slides with placeholder images
const demoSlides: SlideContent[] = [
  {
    type: 'image',
    content: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
  },
  {
    type: 'image',
    content: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80'
  },
  {
    type: 'markdown',
    content: '# Linear Equations\n\nA linear equation is an equation that can be written in the form:\n\n**y = mx + b**\n\nWhere:\n- m is the slope of the line\n- b is the y-intercept',
    multipleChoice: {
      question: 'What does the variable m represent in a linear equation?',
      options: ['The y-intercept', 'The slope', 'The x-coordinate', 'The origin'],
      correctAnswer: 1
    }
  },
];

const initialGoals = [
  { id: '1', description: 'Identify the y-intercept in a linear equation', completed: false },
  { id: '2', description: 'Calculate the slope of a line', completed: false },
  { id: '3', description: 'Understand the slope-intercept form', completed: false },
];

const StudentView = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState(demoSlides);
  const [goals, setGoals] = useState(initialGoals);
  const [isPaused, setIsPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>("Connected to class: Linear Equations 101");
  
  const handleSlideChange = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
  };
  
  const handleGoalCompleted = (goalId: string) => {
    setGoals(currentGoals => 
      currentGoals.map(goal => 
        goal.id === goalId ? { ...goal, completed: true } : goal
      )
    );
    toast.success(`Goal completed: ${goals.find(g => g.id === goalId)?.description}`);
  };
  
  const simulateTeacherPause = () => {
    // This is just for demo purposes to simulate what happens when a teacher pauses
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Chat has been resumed by the teacher' : 'Chat has been paused by the teacher');
  };
  
  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Student View</h1>
          <div className="flex items-center gap-4">
            {statusMessage && (
              <div className="text-sm font-medium text-muted-foreground px-3 py-1 bg-muted/30 rounded-md">
                {statusMessage}
              </div>
            )}
            {/* Demo button to simulate teacher actions */}
            <Button 
              variant="outline" 
              onClick={simulateTeacherPause}
              className="text-sm"
            >
              Simulate Teacher {isPaused ? "Resume" : "Pause"}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="lg:col-span-2 flex flex-col space-y-6">
            <div className="flex-1">
              <SlideViewer 
                slides={slides} 
                currentSlide={currentSlide}
                onSlideChange={handleSlideChange}
                className="h-full"
              />
            </div>
            
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-2">Current Slide: {currentSlide + 1} of {slides.length}</h3>
              <p className="text-sm text-muted-foreground">
                Move through the slides to see different content types (images, markdown, quizzes)
              </p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-6 h-full">
            <GoalTracker 
              goals={goals} 
              mode="student"
              className="flex-none"
            />
            
            <ChatWindow 
              goals={goals}
              onGoalCompleted={handleGoalCompleted}
              isPaused={isPaused}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentView;
