
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import SlideViewer from '@/components/ui/SlideViewer';
import GoalTracker from '@/components/ui/GoalTracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Demo slides
const demoSlides = [
  'https://images.unsplash.com/photo-1589756842055-e4a8d757e238?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
  'https://images.unsplash.com/photo-1562654306-973b5cfe0c86?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
  'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
];

// Demo goals
const initialGoals = [
  { id: '1', description: 'Identify the y-intercept in a linear equation', completed: false },
  { id: '2', description: 'Calculate the slope of a line', completed: false },
  { id: '3', description: 'Understand the slope-intercept form', completed: false },
];

// Demo students
const initialStudents = [
  { id: '1', name: 'Alex Johnson', completedGoals: [] },
  { id: '2', name: 'Taylor Smith', completedGoals: [] },
  { id: '3', name: 'Jordan Brown', completedGoals: [] },
  { id: '4', name: 'Casey Williams', completedGoals: [] },
  { id: '5', name: 'Morgan Davis', completedGoals: [] },
];

const TeacherDashboard = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState(demoSlides);
  const [goals, setGoals] = useState(initialGoals);
  const [students, setStudents] = useState(initialStudents);
  const [isPaused, setIsPaused] = useState(false);
  const [accessCode, setAccessCode] = useState('MATH101');
  const [newGoal, setNewGoal] = useState('');
  
  // Simulate student progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setStudents(currentStudents => {
          const updatedStudents = [...currentStudents];
          const randomStudentIndex = Math.floor(Math.random() * updatedStudents.length);
          const randomGoalIndex = Math.floor(Math.random() * goals.length);
          const goalId = goals[randomGoalIndex].id;
          
          if (!updatedStudents[randomStudentIndex].completedGoals.includes(goalId)) {
            updatedStudents[randomStudentIndex] = {
              ...updatedStudents[randomStudentIndex],
              completedGoals: [...updatedStudents[randomStudentIndex].completedGoals, goalId]
            };
            
            toast.success(`${updatedStudents[randomStudentIndex].name} completed a goal!`);
          }
          
          return updatedStudents;
        });
      }
    }, 15000); // Every 15 seconds
    
    return () => clearInterval(interval);
  }, [goals]);
  
  const handleSlideChange = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
    // In a real app, this would sync with student views
    toast.info(`Changed to slide ${slideIndex + 1}`);
  };
  
  const handleUploadSlide = () => {
    // In a real app, this would open a file picker
    toast.info('File upload would open here');
  };
  
  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Student chats resumed' : 'Student chats paused');
  };
  
  const generateNewCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setAccessCode(result);
    toast.success(`New access code generated: ${result}`);
  };
  
  const addNewGoal = () => {
    if (!newGoal.trim()) {
      toast.error('Please enter a goal description');
      return;
    }
    
    const newGoalObj = {
      id: (goals.length + 1).toString(),
      description: newGoal,
      completed: false
    };
    
    setGoals([...goals, newGoalObj]);
    setNewGoal('');
    toast.success('New goal added successfully');
  };
  
  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-muted/30 rounded-md px-3 py-1">
              <span className="text-sm font-medium mr-2">Class Code:</span>
              <span className="font-mono text-primary">{accessCode}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2" 
                onClick={generateNewCode}
              >
                Refresh
              </Button>
            </div>
            <Button
              variant={isPaused ? "default" : "outline"}
              onClick={handleTogglePause}
            >
              {isPaused ? 'Resume Chats' : 'Pause Chats'}
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
                editable={true}
                className="h-full"
              />
            </div>
            
            <div className="bg-white rounded-lg border p-4 animate-fade-in">
              <h3 className="font-medium mb-3">Slide Management</h3>
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleUploadSlide}>
                  Upload New Slide
                </Button>
                <Button variant="outline" onClick={() => toast.info('This would delete the current slide')}>
                  Delete Current Slide
                </Button>
                <Button variant="outline" onClick={() => toast.info('This would reorder slides')}>
                  Reorder Slides
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-6">
            <GoalTracker 
              goals={goals} 
              students={students} 
              mode="teacher" 
              className="flex-1"
            />
            
            <div className="bg-white rounded-lg border p-4 animate-fade-in">
              <h3 className="font-medium mb-3">Add Learning Goal</h3>
              <div className="space-y-3">
                <Textarea
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Describe a new learning goal..."
                  className="min-h-[80px]"
                />
                <Button onClick={addNewGoal}>
                  Add Goal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TeacherDashboard;
