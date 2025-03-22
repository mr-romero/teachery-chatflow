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

  // Load lessons on mount
  React.useEffect(() => {
    const storedLessons = lessonStore.getAllLessons();
    setLessons(storedLessons);
    
    // Check for active lesson
    const active = lessonStore.getActiveLesson();
    if (active) {
      setActiveLesson(active);
      setMode('teach'); // Resume teaching if there was an active lesson
    }

    // Clean up any stale student sessions
    studentStore.cleanupStaleSessions();
  }, []);

  const handleCreateNewLesson = () => {
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

    lessonStore.saveLesson(newLesson);
    setLessons(prev => [...prev, newLesson]);
    setActiveLesson(newLesson);
    setMode('edit');
    setShowNewLesson(false);
    toast.success('New lesson created');
  };

  const handleEditLesson = (lesson: StoredLesson) => {
    setActiveLesson(lesson);
    setMode('edit');
  };

  const handleStartTeaching = (lesson: StoredLesson) => {
    // Check if there's already an active lesson
    const currentActive = lessonStore.getActiveLesson();
    if (currentActive && currentActive.id !== lesson.id) {
      toast.error('Please end the current active lesson first');
      return;
    }

    setActiveLesson(lesson);
    lessonStore.setActiveLesson(lesson.id);
    setMode('teach');
    toast.success('Lesson started - Share the class code with your students');
  };

  const handleSaveLesson = (updatedLesson: StoredLesson) => {
    lessonStore.saveLesson(updatedLesson);
    setLessons(prev => 
      prev.map(lesson => 
        lesson.id === updatedLesson.id ? updatedLesson : lesson
      )
    );
    setActiveLesson(updatedLesson);
    toast.success('Lesson saved successfully');
  };

  const handleEndTeaching = () => {
    if (activeLesson) {
      // Get active students for notification
      const activeStudents = studentStore.getActiveStudents(activeLesson.id);
      
      // Clear active lesson status
      lessonStore.setActiveLesson(null);
      
      // Save lesson state with isPaused reset
      handleSaveLesson({
        ...activeLesson,
        isPaused: false
      });
      
      // Notify about disconnected students
      if (activeStudents.length > 0) {
        toast.info(`Notified ${activeStudents.length} students that the lesson has ended`);
      }
    }
    
    setMode('list');
    setActiveLesson(null);
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (activeLesson?.id === lessonId) {
      toast.error('Cannot delete an active lesson');
      return;
    }

    lessonStore.deleteLesson(lessonId);
    setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
    toast.success('Lesson deleted');
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
