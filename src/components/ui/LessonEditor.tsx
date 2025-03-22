import React, { useEffect, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { SlideEditor } from './SlideEditor';
import { SlideViewer } from './SlideViewer';
import { SlideCarousel } from './SlideCarousel';
import { StoredLesson } from '@/lib/stores/lessonStore';
import { Slide, Goal } from '@/types';
import { Plus, Save, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

interface LessonEditorProps {
  lesson: StoredLesson;
  onSave: (lesson: StoredLesson) => void;
  onStartTeaching: () => void;
}

export function LessonEditor({
  lesson: initialLesson,
  onSave,
  onStartTeaching,
}: LessonEditorProps) {
  const [lesson, setLesson] = React.useState(initialLesson);
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [showSlideEditor, setShowSlideEditor] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const lastSaveRef = useRef<number>(Date.now());

  const handleSave = () => {
    // Check if enough time has passed since last save
    const now = Date.now();
    if (now - lastSaveRef.current < 1000) {
      return; // Skip if less than 1 second has passed
    }

    lastSaveRef.current = now;
    onSave(lesson);
  };

  // Auto-save when lesson changes
  useEffect(() => {
    if (!isEditing) return; // Don't save while actively editing
    const timeoutId = setTimeout(handleSave, 1000);
    return () => clearTimeout(timeoutId);
  }, [lesson, isEditing]);

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Slide ${lesson.slides.length + 1}`,
      content: {
        type: 'markdown',
        content: { text: '' }
      },
      goals: []
    };

    setLesson(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
    setCurrentSlideIndex(lesson.slides.length);
    setShowSlideEditor(true);
    setIsEditing(true);
  };

  const handleDeleteSlide = () => {
    if (lesson.slides.length <= 1) {
      toast.error("Cannot delete the last slide");
      return;
    }

    setLesson(prev => ({
      ...prev,
      slides: prev.slides.filter((_, index) => index !== currentSlideIndex)
    }));
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    setShowDeleteConfirm(false);
    setShowSlideEditor(false);
    setIsEditing(true);
    toast.success("Slide deleted");
  };

  const handleUpdateSlide = (updatedSlide: Slide) => {
    setLesson(prev => ({
      ...prev,
      slides: prev.slides.map((slide, index) =>
        index === currentSlideIndex ? updatedSlide : slide
      )
    }));
    setIsEditing(true);
  };

  const handleUpdateGoals = (goals: Goal[]) => {
    setLesson(prev => ({
      ...prev,
      goals
    }));
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="space-y-2">
          <Input
            value={lesson.title}
            onChange={(e) => {
              setLesson(prev => ({ ...prev, title: e.target.value }));
              setIsEditing(true);
            }}
            placeholder="Enter lesson title..."
            className="text-lg font-semibold"
          />
          <div className="text-sm text-muted-foreground">
            {lesson.slides.length} slides • {lesson.goals.length} goals
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddSlide}>
            <Plus className="h-4 w-4 mr-2" /> Add Slide
          </Button>
          {lesson.slides.length > 1 && (
            <Button 
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete Slide
            </Button>
          )}
          <Button
            onClick={handleSave}
            variant="secondary"
          >
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
          <Button onClick={onStartTeaching}>
            <Play className="h-4 w-4 mr-2" /> Start Teaching
          </Button>
        </div>
      </div>

      {/* Slide Carousel */}
      <SlideCarousel
        slides={lesson.slides}
        currentSlideIndex={currentSlideIndex}
        onSelect={setCurrentSlideIndex}
        className="mb-6"
      />

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        <div className="relative">
          <Button
            className="absolute right-4 top-4 z-10"
            onClick={() => setShowSlideEditor(true)}
            variant="outline"
          >
            Edit Slide
          </Button>
          <SlideViewer
            slides={lesson.slides}
            currentSlide={currentSlideIndex}
            onSlideChange={setCurrentSlideIndex}
            editable={false}
            className="min-h-[400px] border rounded-lg"
          />
        </div>

        <div className="space-y-6">
          {/* Goals */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-4">Lesson Goals</h3>
            <div className="space-y-2">
              {lesson.goals.map((goal) => (
                <div key={goal.id} className="flex gap-2">
                  <Input
                    value={goal.description}
                    onChange={(e) => {
                      handleUpdateGoals(lesson.goals.map(g =>
                        g.id === goal.id ? { ...g, description: e.target.value } : g
                      ));
                    }}
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  handleUpdateGoals([
                    ...lesson.goals,
                    {
                      id: Math.random().toString(36).substr(2, 9),
                      description: '',
                      completed: false
                    }
                  ]);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Goal
              </Button>
            </div>
          </div>

          {/* System Prompt */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-4">AI Teaching Assistant Settings</h3>
            <Input
              value={lesson.systemPrompt}
              onChange={(e) => {
                setLesson(prev => ({ ...prev, systemPrompt: e.target.value }));
                setIsEditing(true);
              }}
              placeholder="Enter custom system prompt..."
            />
          </div>
        </div>
      </div>

      {/* Slide Editor Dialog */}
      {showSlideEditor && lesson.slides[currentSlideIndex] && (
        <Dialog open={showSlideEditor} onOpenChange={setShowSlideEditor}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Slide</DialogTitle>
              <DialogDescription>
                Add content and configure goals for this slide.
              </DialogDescription>
            </DialogHeader>
            <SlideEditor
              slide={lesson.slides[currentSlideIndex]}
              onUpdate={handleUpdateSlide}
              onClose={() => setShowSlideEditor(false)}
              availableGoals={lesson.goals}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this slide? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSlide} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
