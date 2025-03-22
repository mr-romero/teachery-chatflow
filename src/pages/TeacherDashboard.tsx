
import { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import SlideViewer, { SlideContent } from '@/components/ui/SlideViewer';
import SlideEditor from '@/components/ui/SlideEditor';
import GoalTracker from '@/components/ui/GoalTracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Plus, Upload, Edit, Trash2, Save, FileText, FileImage } from 'lucide-react';

// Initial slides
const initialSlides: SlideContent[] = [
  {
    type: 'image',
    content: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
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

// Initial goals
const initialGoals = [
  { id: '1', description: 'Identify the y-intercept in a linear equation', completed: false },
  { id: '2', description: 'Calculate the slope of a line', completed: false },
  { id: '3', description: 'Understand the slope-intercept form', completed: false },
];

// Default system prompt
const defaultSystemPrompt = `You are a helpful math tutor. Your goal is to guide students in understanding linear equations. 
Don't give direct answers immediately, but encourage critical thinking by asking guiding questions. 
When students demonstrate understanding of a concept, acknowledge their achievement.`;

const TeacherDashboard = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideContent[]>(initialSlides);
  const [goals, setGoals] = useState(initialGoals);
  const [students, setStudents] = useState<{ id: string; name: string; completedGoals: string[] }[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [accessCode, setAccessCode] = useState('MATH101');
  const [newGoal, setNewGoal] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(defaultSystemPrompt);
  const [lessonTitle, setLessonTitle] = useState('Linear Equations 101');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog states
  const [showSlideEditor, setShowSlideEditor] = useState(false);
  const [showAddSlideDialog, setShowAddSlideDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          // Handle different file types
          if (file.type.includes('image')) {
            const newSlide: SlideContent = {
              type: 'image',
              content: result
            };
            addSlide(newSlide);
          } else if (file.type === 'application/pdf') {
            // For PDFs, we'd typically upload to storage
            // This is a simplified version that won't work for PDFs
            // In a real app, this would upload to cloud storage
            const newSlide: SlideContent = {
              type: 'pdf',
              content: window.URL.createObjectURL(file)
            };
            addSlide(newSlide);
          }
        }
      } catch (error) {
        toast.error('Failed to process file');
      }
    };
    
    if (file.type.includes('image')) {
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // In a real implementation, we'd upload this to storage
      // and get a URL back, but for demo we'll just create an object URL
      const newSlide: SlideContent = {
        type: 'pdf',
        content: window.URL.createObjectURL(file)
      };
      addSlide(newSlide);
    }
  };
  
  const addSlide = (slide: SlideContent) => {
    setSlides((prevSlides) => [...prevSlides, slide]);
    setCurrentSlide(slides.length); // Move to the new slide
    toast.success('New slide added');
    setShowAddSlideDialog(false);
    
    // Open the editor for the new slide
    if (slide.type !== 'image' && slide.type !== 'pdf') {
      setShowSlideEditor(true);
    }
  };
  
  const handleSlideChange = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
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
    setShowGoalDialog(false);
    toast.success('New goal added successfully');
  };

  const handleAddMarkdownSlide = () => {
    const newSlide: SlideContent = {
      type: 'markdown',
      content: '# New Slide\n\nAdd your content here'
    };
    
    addSlide(newSlide);
    setShowSlideEditor(true);
  };

  const handleUpdateSlide = (updatedSlide: SlideContent) => {
    const newSlides = [...slides];
    newSlides[currentSlide] = updatedSlide;
    setSlides(newSlides);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) {
      toast.error('Cannot delete the only slide');
      return;
    }

    const newSlides = slides.filter((_, index) => index !== currentSlide);
    setSlides(newSlides);
    
    // Adjust current slide if needed
    if (currentSlide >= newSlides.length) {
      setCurrentSlide(newSlides.length - 1);
    }
    
    toast.success('Slide deleted');
  };

  const handleEditCurrentSlide = () => {
    setShowSlideEditor(true);
  };
  
  const handleSaveLesson = () => {
    const lesson = {
      title: lessonTitle,
      slides,
      goals,
      systemPrompt
    };
    
    // In a real app, this would save to a database
    // For now, we'll just output to the console and show a success toast
    console.log('Saving lesson:', lesson);
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(lesson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonTitle.replace(/\s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowSaveDialog(false);
    toast.success('Lesson saved successfully');
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleSystemPromptUpdate = () => {
    toast.success('System prompt updated');
    // In a real app, this would sync with an API
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <Input 
              value={lessonTitle} 
              onChange={(e) => setLessonTitle(e.target.value)} 
              className="max-w-[250px] font-medium"
              placeholder="Lesson Title"
            />
          </div>
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
            <div className="flex-1 relative group">
              <SlideViewer 
                slides={slides} 
                currentSlide={currentSlide} 
                onSlideChange={handleSlideChange}
                editable={true}
                className="h-full"
              />
              
              <div className="absolute inset-0 bg-black/50 items-center justify-center flex opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex gap-2">
                  <Button onClick={handleEditCurrentSlide}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Slide
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteSlide}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Hidden file input */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="hidden"
            />
            
            <div className="bg-white rounded-lg border p-4 animate-fade-in">
              <h3 className="font-medium mb-3">Slide Management</h3>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => setShowAddSlideDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add New Slide
                </Button>
                <Button variant="outline" onClick={handleEditCurrentSlide}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Current Slide
                </Button>
                <Button 
                  variant="outline" 
                  className="ml-auto" 
                  onClick={() => setShowSaveDialog(true)}
                >
                  <Save className="mr-2 h-4 w-4" /> Save Lesson
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-4 animate-fade-in">
              <h3 className="font-medium mb-3">System Prompt</h3>
              <div className="space-y-3">
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Instructions for the AI assistant..."
                  className="min-h-[80px]"
                />
                <Button onClick={handleSystemPromptUpdate}>
                  Update AI Prompt
                </Button>
                <p className="text-xs text-muted-foreground">
                  This prompt will guide how the AI interacts with students.
                </p>
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
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Learning Goals</h3>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowGoalDialog(true)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Goal
                </Button>
              </div>
              <ul className="space-y-2">
                {goals.map((goal) => (
                  <li key={goal.id} className="text-sm flex gap-2 items-start">
                    <div className="w-4 h-4 mt-0.5 rounded-full border flex-shrink-0" />
                    {goal.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Add Slide Dialog */}
      <Dialog open={showAddSlideDialog} onOpenChange={setShowAddSlideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Slide</DialogTitle>
            <DialogDescription>
              Choose a type of content to add to your lesson
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={triggerFileInput}
                className="h-32 flex flex-col"
              >
                <FileImage className="h-10 w-10 mb-2" />
                <span>Upload Image</span>
                <span className="text-xs mt-1 text-muted-foreground">(JPEG, PNG)</span>
              </Button>
              <Button 
                onClick={handleAddMarkdownSlide}
                variant="outline"
                className="h-32 flex flex-col"
              >
                <FileText className="h-10 w-10 mb-2" />
                <span>Create Content</span>
                <span className="text-xs mt-1 text-muted-foreground">(Text, Quiz, etc.)</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Lesson Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Lesson</DialogTitle>
            <DialogDescription>
              Your lesson will be saved as a file that you can share or load later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="lesson-title" className="text-sm font-medium">Lesson Title</label>
              <Input 
                id="lesson-title"
                value={lessonTitle} 
                onChange={(e) => setLessonTitle(e.target.value)} 
                placeholder="Enter a title for your lesson"
              />
            </div>
            <div className="pt-2">
              <Button onClick={handleSaveLesson} className="w-full">
                <Save className="mr-2 h-4 w-4" /> Save Lesson
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Slide Editor Dialog */}
      {showSlideEditor && (
        <Dialog open={showSlideEditor} onOpenChange={setShowSlideEditor}>
          <DialogContent className="max-w-3xl max-h-[80vh] p-0">
            <SlideEditor 
              slide={slides[currentSlide]}
              onUpdate={handleUpdateSlide}
              onClose={() => setShowSlideEditor(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Add Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Learning Goal</DialogTitle>
            <DialogDescription>
              Create a new learning objective for students to achieve
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
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
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default TeacherDashboard;
