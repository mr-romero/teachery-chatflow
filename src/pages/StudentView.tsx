import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { SlideViewer } from '@/components/ui/SlideViewer';
import { ChatInterface } from '@/components/ui/ChatInterface';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lesson, StudentSession } from '@/types';
import { toast } from 'sonner';
import { lessonStore } from '@/lib/stores/lessonStore';
import { studentStore } from '@/lib/stores/studentStore';

const StudentView = () => {
  const [currentLesson, setCurrentLesson] = React.useState<Lesson | null>(null);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [accessCode, setAccessCode] = React.useState('');
  const [isJoined, setIsJoined] = React.useState(false);
  const [studentName, setStudentName] = React.useState('');
  const [session, setSession] = React.useState<StudentSession | null>(null);

  // Check for existing session
  React.useEffect(() => {
    // Get student ID from local storage
    const savedStudentId = localStorage.getItem('teachery_current_student');
    if (savedStudentId) {
      const savedSession = studentStore.getSession(savedStudentId);
      if (savedSession) {
        const lesson = lessonStore.getLessonById(savedSession.lessonId);
        if (lesson) {
          setSession(savedSession);
          setStudentName(savedSession.studentName);
          setCurrentLesson(lesson);
          setCurrentSlide(savedSession.currentSlide);
          setIsJoined(true);
          toast.success(`Welcome back, ${savedSession.studentName}!`);
        }
      }
    }
  }, []);

  // Keep session alive and sync with teacher
  React.useEffect(() => {
    if (isJoined && session && currentLesson) {
      const updateInterval = setInterval(() => {
        // Update last active timestamp
        studentStore.updateSession(session.studentId, {
          lastActive: Date.now(),
          currentSlide
        });

        // Check for lesson updates
        const updatedLesson = lessonStore.getLessonById(currentLesson.id);
        if (updatedLesson) {
          setCurrentLesson(updatedLesson);
          
          // Sync with teacher's slide if different
          const teacherSlide = localStorage.getItem(`teachery_lesson_${updatedLesson.id}_slide`);
          if (teacherSlide) {
            const targetSlide = parseInt(teacherSlide, 10);
            if (!isNaN(targetSlide) && targetSlide !== currentSlide) {
              setCurrentSlide(targetSlide);
            }
          }
        } else {
          // Lesson ended
          handleEndLesson();
          toast.error('The lesson has ended');
        }
      }, 1000);

      return () => clearInterval(updateInterval);
    }
  }, [isJoined, session, currentLesson, currentSlide]);

  const joinLesson = async () => {
    if (!accessCode.trim() || !studentName.trim()) {
      toast.error('Please enter both your name and the class code');
      return;
    }

    try {
      const lesson = lessonStore.getLessonByAccessCode(accessCode.trim().toUpperCase());
      
      if (!lesson) {
        toast.error('Invalid class code. Please check and try again.');
        return;
      }

      // Create new student session
      const newSession = studentStore.createSession(studentName, lesson.id);
      setSession(newSession);
      
      // Save student ID for reconnection
      localStorage.setItem('teachery_current_student', newSession.studentId);

      setCurrentLesson(lesson);

      // Set initial slide from teacher's position
      const savedSlide = localStorage.getItem(`teachery_lesson_${lesson.id}_slide`);
      if (savedSlide) {
        const initialSlide = parseInt(savedSlide, 10);
        setCurrentSlide(initialSlide);
        studentStore.updateSession(newSession.studentId, { currentSlide: initialSlide });
      }

      setIsJoined(true);
      toast.success(`Welcome ${studentName}! You've joined ${lesson.title}`);
    } catch (error) {
      console.error('Join error:', error);
      toast.error('Failed to join the lesson. Please try again.');
    }
  };

  const handleEndLesson = () => {
    if (session) {
      studentStore.endSession(session.studentId);
      localStorage.removeItem('teachery_current_student');
    }
    setSession(null);
    setCurrentLesson(null);
    setIsJoined(false);
    setCurrentSlide(0);
  };

  const handleGoalComplete = React.useCallback((goalId: string) => {
    if (session) {
      studentStore.addCompletedGoal(session.studentId, goalId);
      toast.success('Goal completed! Your progress has been saved.');
    }
  }, [session]);

  return (
    <MainLayout>
      {!isJoined ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
          <div className="w-full max-w-md space-y-4">
            <h2 className="text-2xl font-bold text-center">Join Lesson</h2>
            <div className="space-y-4">
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Your name..."
              />
              <Input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter class code..."
                className="font-mono"
              />
              <Button 
                onClick={joinLesson} 
                className="w-full"
                disabled={!accessCode.trim() || !studentName.trim()}
              >
                Join
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
            <div>
              <h2 className="font-semibold">{currentLesson?.title}</h2>
              <p className="text-sm text-muted-foreground">Logged in as {studentName}</p>
            </div>
            {currentLesson?.isPaused && (
              <div className="text-yellow-600 font-medium">
                Class is paused by the teacher
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-6 flex-1 p-6">
            <SlideViewer
              slides={currentLesson?.slides || []}
              currentSlide={currentSlide}
              onSlideChange={() => {}}
              editable={false}
              className="h-full"
            />
            <ChatInterface
              goals={currentLesson?.slides[currentSlide]?.goals || []}
              isPaused={currentLesson?.isPaused || false}
              onGoalComplete={handleGoalComplete}
              systemPrompt={currentLesson?.systemPrompt}
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default StudentView;
