
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import SlideViewer, { SlideContent } from '@/components/ui/SlideViewer';
import ChatWindow from '@/components/ui/ChatWindow';
import GoalTracker from '@/components/ui/GoalTracker';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

// Default slides
const defaultSlides: SlideContent[] = [
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

const defaultGoals = [
  { id: '1', description: 'Identify the y-intercept in a linear equation', completed: false },
  { id: '2', description: 'Calculate the slope of a line', completed: false },
  { id: '3', description: 'Understand the slope-intercept form', completed: false },
];

const StudentView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideContent[]>(defaultSlides);
  const [goals, setGoals] = useState(defaultGoals);
  const [isPaused, setIsPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>("Connected to class: Linear Equations 101");
  const [lessonData, setLessonData] = useState<{title: string; slides: SlideContent[]; goals: typeof defaultGoals} | null>(null);
  
  // Try to load lesson data from the URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const lessonCode = params.get('code');
    
    if (lessonCode) {
      setStatusMessage(`Joining class with code: ${lessonCode}...`);
      
      // In a real app, this would fetch lesson data from a server
      // For now, we'll simulate joining with the default data
      setTimeout(() => {
        toast.success(`Joined class with code: ${lessonCode}`);
        setStatusMessage(`Connected to class: Linear Equations 101 (${lessonCode})`);
      }, 1500);
    }
    
    // Check for uploaded lesson data (this would come from loading a file in a real app)
    const storedLesson = localStorage.getItem('currentLesson');
    if (storedLesson) {
      try {
        const lessonData = JSON.parse(storedLesson);
        setSlides(lessonData.slides || defaultSlides);
        setGoals(lessonData.goals || defaultGoals);
        setStatusMessage(`Connected to class: ${lessonData.title || 'Linear Equations 101'}`);
        toast.success(`Loaded lesson: ${lessonData.title || 'Linear Equations 101'}`);
      } catch (e) {
        console.error('Failed to parse stored lesson data', e);
      }
    }
  }, [location.search]);
  
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
  
  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      toast.success('Correct answer!');
      
      // If this slide helps complete a goal, mark it as completed
      // In a real app, this would be more sophisticated
      if (currentSlide === 2 && !goals[0].completed) {
        handleGoalCompleted('1');
      }
    } else {
      toast.error('Incorrect answer. Try again!');
    }
  };
  
  const handleUploadLesson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const lessonData = JSON.parse(result);
          setSlides(lessonData.slides || []);
          setGoals(lessonData.goals || []);
          setStatusMessage(`Loaded lesson: ${lessonData.title || 'Untitled Lesson'}`);
          
          // Store in localStorage for persistence
          localStorage.setItem('currentLesson', result);
          
          toast.success(`Lesson loaded: ${lessonData.title || 'Untitled Lesson'}`);
        }
      } catch (error) {
        toast.error('Failed to parse lesson file');
        console.error(error);
      }
    };
    reader.readAsText(file);
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
            <input
              type="file"
              id="lessonUpload"
              className="hidden"
              accept=".json"
              onChange={handleUploadLesson}
            />
            <label htmlFor="lessonUpload">
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => document.getElementById('lessonUpload')?.click()}
              >
                Load Lesson File
              </Button>
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="lg:col-span-2 flex flex-col space-y-6">
            <div className="flex-1">
              <SlideViewer 
                slides={slides} 
                currentSlide={currentSlide}
                onSlideChange={handleSlideChange}
                onAnswerSubmit={handleAnswerSubmit}
                className="h-full"
              />
            </div>
            
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-2">Current Slide: {currentSlide + 1} of {slides.length}</h3>
              <p className="text-sm text-muted-foreground">
                Use the navigation controls to move through the slides
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
