
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import SlideViewer from '@/components/ui/SlideViewer';
import ChatWindow from '@/components/ui/ChatWindow';
import GoalTracker from '@/components/ui/GoalTracker';
import { toast } from 'sonner';

// Use the same demo slides and goals as teacher view
const demoSlides = [
  'https://images.unsplash.com/photo-1589756842055-e4a8d757e238?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
  'https://images.unsplash.com/photo-1562654306-973b5cfe0c86?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
  'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
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
  
  // Simulate teacher slide changes
  useEffect(() => {
    const slideChangeListener = (event: MessageEvent) => {
      if (event.data && event.data.type === 'slideChange') {
        setCurrentSlide(event.data.slideIndex);
        toast.info(`Teacher changed to slide ${event.data.slideIndex + 1}`);
      }
      
      if (event.data && event.data.type === 'pauseChat') {
        setIsPaused(event.data.isPaused);
        if (event.data.isPaused) {
          toast.info('Chat has been paused by the teacher');
        } else {
          toast.info('Chat has been resumed by the teacher');
        }
      }
    };
    
    // For demonstration purposes - in a real app this would use WebSockets
    window.addEventListener('message', slideChangeListener);
    
    // Simulate random teacher actions for the demo
    const interval = setInterval(() => {
      // Randomly change slides or pause/resume
      const action = Math.random();
      if (action > 0.7) {
        const newSlideIndex = Math.floor(Math.random() * slides.length);
        window.postMessage({ type: 'slideChange', slideIndex: newSlideIndex }, '*');
      } else if (action > 0.4) {
        window.postMessage({ type: 'pauseChat', isPaused: !isPaused }, '*');
      }
    }, 45000); // Every 45 seconds
    
    return () => {
      window.removeEventListener('message', slideChangeListener);
      clearInterval(interval);
    };
  }, [slides.length, isPaused]);
  
  const handleGoalCompleted = (goalId: string) => {
    setGoals(currentGoals => 
      currentGoals.map(goal => 
        goal.id === goalId ? { ...goal, completed: true } : goal
      )
    );
  };
  
  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Student View</h1>
          <div className="text-sm font-medium text-muted-foreground animate-slide-in">
            Connected to class: Linear Equations 101
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="lg:col-span-2 flex flex-col space-y-6">
            <div className="flex-1">
              <SlideViewer 
                slides={slides} 
                currentSlide={currentSlide} 
                className="h-full"
              />
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
