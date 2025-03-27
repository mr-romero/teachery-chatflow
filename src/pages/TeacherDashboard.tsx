import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { LessonEditor } from '@/components/ui/LessonEditor';
import { ActiveLesson } from '@/components/ui/ActiveLesson';
import { Button } from '@/components/ui/button';
import { Plus, Play, Edit, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StoredLesson, lessonStore } from '@/lib/stores/lessonStore';
import { studentStore } from '@/lib/stores/studentStore';
import { toast } from 'sonner';
import { SlideContent } from '@/types';
import { cn } from '@/lib/utils';

type DashboardMode = 'list' | 'edit' | 'teach';

const generateAccessCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const getInitialSlideContent = (): SlideContent => ({
  type: 'markdown',
  content: { text: '# Welcome to your new lesson\n\nStart by adding content here.' }
});

const TeacherDashboard = () => {
  const [mode, setMode] = React.useState<DashboardMode>('list');
  const [lessons, setLessons] = React.useState<StoredLesson[]>([]);
  const [showNewLesson, setShowNewLesson] = React.useState(false);
  const [activeLesson, setActiveLesson] = React.useState<StoredLesson | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load lessons on mount
  React.useEffect(() => {
    const loadLessons = async () => {
      setIsLoading(true);
      try {
        const storedLessons = await lessonStore.getAllLessons();
        setLessons(storedLessons);
        
        // Check for active lesson
        const active = await lessonStore.getActiveLesson();
        if (active) {
          setActiveLesson(active);
          setMode('teach'); // Resume teaching if there was an active lesson
        }
        // Clean up any stale student sessions
        studentStore.cleanupStaleSessions();
      } catch (error) {
        console.error("Error loading lessons:", error);
        toast.error("Failed to load lessons");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLessons();
  }, []);

  const handleCreateNewLesson = async () => {
    const newLesson: StoredLesson = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Lesson',
      slides: [{
        id: Math.random().toString(36).substr(2, 9),
        content: getInitialSlideContent(),
        goals: []
      }],
      goals: [],
      accessCode: generateAccessCode(),
      systemPrompt: '',
      isPaused: false,
      createdAt: Date.now()
    };
    
    try {
      await lessonStore.saveLesson(newLesson);
      setLessons(prev => [...prev, newLesson]);
      setActiveLesson(newLesson);
      setMode('edit');
      setShowNewLesson(false);
      toast.success('New lesson created');
    } catch (error) {
      console.error("Error creating lesson:", error);
      toast.error("Failed to create new lesson");
    }
  };

  const handleEditLesson = (lesson: StoredLesson) => {
    setActiveLesson(lesson);
    setMode('edit');
  };

  const handleStartTeaching = async (lesson: StoredLesson) => {
    // Check if there's already an active lesson
    const currentActive = await lessonStore.getActiveLesson();
    if (currentActive && currentActive.id !== lesson.id) {
      toast.error('Please end the current active lesson first');
      return;
    }
    
    try {
      await lessonStore.setActiveLesson(lesson.id);
      setActiveLesson(lesson);
      setMode('teach');
      toast.success('Lesson started - Share the class code with your students');
    } catch (error) {
      console.error("Error starting lesson:", error);
      toast.error("Failed to start teaching");
    }
  };

  const handleSaveLesson = async (updatedLesson: StoredLesson) => {
    try {
      await lessonStore.saveLesson(updatedLesson);
      setLessons(prev => 
        prev.map(lesson => 
          lesson.id === updatedLesson.id ? updatedLesson : lesson
        )
      );
      setActiveLesson(updatedLesson);
      toast.success('Lesson saved successfully');
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast.error("Failed to save lesson");
    }
  };

  const handleEndTeaching = async () => {
    if (activeLesson) {
      try {
        // Get active students for notification
        const activeStudents = await studentStore.getActiveStudents(activeLesson.id);
        
        // Clear active lesson status
        await lessonStore.setActiveLesson(null);
        
        // Save lesson state with isPaused reset
        await handleSaveLesson({
          ...activeLesson,
          isPaused: false
        });
        
        // Notify about disconnected students
        if (activeStudents.length > 0) {
          toast.info(`Notified ${activeStudents.length} students that the lesson has ended`);
        }
        
        setMode('list');
        setActiveLesson(null);
      } catch (error) {
        console.error("Error ending teaching:", error);
        toast.error("Failed to end teaching session");
      }
    } else {
      setMode('list');
      setActiveLesson(null);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      // First, check if this is the active lesson
      const active = await lessonStore.getActiveLesson();
      
      // If this is the active lesson, first end the teaching session
      if (active?.id === lessonId) {
        // Force clear the active lesson status
        await lessonStore.setActiveLesson(null);
        localStorage.removeItem('teachery_active_lesson');
        toast.info('Active lesson has been ended');
      }
      
      // Now delete the lesson
      await lessonStore.deleteLesson(lessonId);
      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
      toast.success('Lesson deleted');
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Failed to delete lesson");
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'edit':
        return activeLesson ? (
          <LessonEditor
            lesson={activeLesson}
            onSave={handleSaveLesson}
            onStartTeaching={() => handleStartTeaching(activeLesson)}
          />
        ) : null;

      case 'teach':
        return activeLesson ? (
          <ActiveLesson
            lesson={activeLesson}
            onEditLesson={() => setMode('edit')}
            onEndTeaching={handleEndTeaching}
            onUpdateLesson={handleSaveLesson}
          />
        ) : null;

      case 'list':
      default:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">My Lessons</h1>
              <Button onClick={() => setShowNewLesson(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create New Lesson
              </Button>
            </div>

            {lessons.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <h3 className="text-lg font-medium">No lessons yet</h3>
                <p className="text-muted-foreground mt-2">
                  Create your first lesson to get started
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setShowNewLesson(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Lesson
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {lessons.map(lesson => (
                  <div 
                    key={lesson.id}
                    className={cn(
                      "flex items-center justify-between p-4 bg-white rounded-lg border",
                      lessonStore.getActiveLesson()?.id === lesson.id && "border-primary"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{lesson.title}</h3>
                        {lessonStore.getActiveLesson()?.id === lesson.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lesson.slides.length} slides • {lesson.goals.length} goals
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleEditLesson(lesson)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      {lessonStore.getActiveLesson()?.id === lesson.id ? (
                        <Button 
                          variant="outline"
                          onClick={handleEndTeaching}
                        >
                          End Teaching
                        </Button>
                      ) : (
                        <>
                          <Button 
                            onClick={() => handleStartTeaching(lesson)}
                          >
                            <Play className="mr-2 h-4 w-4" /> Teach
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] p-6 overflow-y-auto">
        {mode !== 'list' && (
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => {
              if (mode === 'teach') {
                handleEndTeaching();
              } else {
                setMode('list');
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lessons
          </Button>
        )}
        {renderContent()}
      </div>

      <Dialog open={showNewLesson} onOpenChange={setShowNewLesson}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Lesson</DialogTitle>
            <DialogDescription>
              Start with a blank lesson and add slides and goals as needed.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <Button onClick={handleCreateNewLesson} className="w-full">
              Create Lesson
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default TeacherDashboard;
