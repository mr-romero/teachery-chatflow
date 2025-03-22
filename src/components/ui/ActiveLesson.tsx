import React from 'react';
import { SlideViewer } from './SlideViewer';
import { GoalTracker } from './GoalTracker';
import { Button } from './button';
import { ChevronLeft, ChevronRight, Eye, Pause, Play, Settings } from 'lucide-react';
import { StoredLesson } from '@/lib/stores/lessonStore';
import { StudentSession } from '@/types';
import { studentStore } from '@/lib/stores/studentStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ActiveLessonProps {
  lesson: StoredLesson;
  onEditLesson: () => void;
  onEndTeaching: () => void;
  onUpdateLesson: (lesson: StoredLesson) => void;
}

export function ActiveLesson({ 
  lesson: initialLesson, 
  onEditLesson, 
  onEndTeaching,
  onUpdateLesson 
}: ActiveLessonProps) {
  const [lesson, setLesson] = React.useState(initialLesson);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [students, setStudents] = React.useState<StudentSession[]>([]);
  const lastUpdateRef = React.useRef<number>(Date.now());
  
  // Track active students using studentStore
  React.useEffect(() => {
    const checkStudents = () => {
      const activeStudents = studentStore.getActiveStudents(lesson.id);
      setStudents(activeStudents);
    };

    checkStudents(); // Initial check
    const interval = setInterval(checkStudents, 1000);
    return () => clearInterval(interval);
  }, [lesson.id]);

  // Save current slide to sync with students
  React.useEffect(() => {
    try {
      localStorage.setItem(`teachery_lesson_${lesson.id}_slide`, currentSlide.toString());
      
      // Update all active student sessions with new slide
      students.forEach(student => {
        studentStore.updateSession(student.studentId, {
          currentSlide,
          lastActive: Date.now()
        });
      });
    } catch (error) {
      console.error('Error syncing slide:', error);
    }
  }, [currentSlide, lesson.id, students]);

  // Debounced lesson state save
  const handleLessonUpdate = React.useCallback((updatedLesson: StoredLesson) => {
    const now = Date.now();
    if (now - lastUpdateRef.current > 1000) { // Only update if more than 1 second has passed
      lastUpdateRef.current = now;
      onUpdateLesson(updatedLesson);
    }
  }, [onUpdateLesson]);

  React.useEffect(() => {
    handleLessonUpdate(lesson);
  }, [lesson, handleLessonUpdate]);

  const handlePreviousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNextSlide = () => {
    if (currentSlide < lesson.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const togglePaused = () => {
    setLesson(prev => {
      const newState = { ...prev, isPaused: !prev.isPaused };
      toast.info(
        newState.isPaused 
          ? 'Chats paused for all students' 
          : 'Chats resumed for all students'
      );
      return newState;
    });
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePreviousSlide();
      } else if (e.key === 'ArrowRight') {
        handleNextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">{lesson.title}</h2>
          <div className="bg-muted/30 px-3 py-1 rounded-md">
            <span className="text-sm font-medium mr-2">Class Code:</span>
            <span className="font-mono text-primary">{lesson.accessCode}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={togglePaused}
            className={cn(
              "transition-colors",
              lesson.isPaused && "text-yellow-600 border-yellow-600"
            )}
          >
            {lesson.isPaused ? (
              <><Play className="mr-2 h-4 w-4" /> Resume Chats</>
            ) : (
              <><Pause className="mr-2 h-4 w-4" /> Pause Chats</>
            )}
          </Button>
          <Button variant="outline" onClick={onEditLesson}>
            <Settings className="mr-2 h-4 w-4" /> Edit Lesson
          </Button>
          <Button variant="outline" onClick={onEndTeaching}>
            <Eye className="mr-2 h-4 w-4" /> Preview Mode
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <div className="flex-1 relative">
            <SlideViewer 
              slides={lesson.slides} 
              currentSlide={currentSlide}
              onSlideChange={setCurrentSlide}
              editable={false}
              className="h-full"
            />
          </div>

          {/* Navigation controls */}
          <div className="flex justify-between items-center px-4 py-2 bg-white rounded-lg border">
            <Button
              variant="outline"
              onClick={handlePreviousSlide}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Slide
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentSlide + 1} of {lesson.slides.length}
            </span>
            <Button
              variant="outline"
              onClick={handleNextSlide}
              disabled={currentSlide === lesson.slides.length - 1}
            >
              Next Slide
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="bg-white rounded-lg border p-4 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Students Online</h3>
              <span className="text-sm text-muted-foreground">
                {students.length} active
              </span>
            </div>
            <div className="space-y-2">
              {students.map((student) => (
                <div 
                  key={student.studentId} 
                  className="flex items-center justify-between bg-muted/20 p-2 rounded"
                >
                  <span>{student.studentName}</span>
                  <div className="text-sm text-muted-foreground">
                    {student.completedGoals?.length || 0} goals completed
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No students connected yet.
                  <div className="text-sm mt-1">
                    Share the class code: <span className="font-mono font-bold">{lesson.accessCode}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium mb-3">Learning Goals Progress</h3>
            <GoalTracker 
              goals={lesson.goals}
              students={students.map(student => ({
                id: student.studentId,
                name: student.studentName,
                completedGoals: student.completedGoals || []
              }))}
              mode="teacher"
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActiveLesson;
