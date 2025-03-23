import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Card } from './card';
import { MultipleChoiceEditor } from './MultipleChoiceEditor';
import { EquationEditor } from './equation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Slide, Goal, MultipleChoice, Equation } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Image as ImageIcon, Plus, X, Upload, AlignLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Switch } from './switch';

interface SlideEditorProps {
  slide: Slide;
  onUpdate: (slide: Slide) => void;
  onClose: () => void;
  availableGoals: Goal[];
}

export function SlideEditor({ slide, onUpdate, onClose, availableGoals }: SlideEditorProps) {
  const [title, setTitle] = useState(slide.title || '');
  const [editingQuestion, setEditingQuestion] = useState<MultipleChoice | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAddEquation = () => {
    if (slide.content.type === 'equation') {
      const newEquation: Equation = {
        latex: '',
        displayMode: true
      };
      onUpdate({
        ...slide,
        content: {
          type: 'equation',
          content: {
            equations: [...slide.content.content.equations, newEquation]
          }
        }
      });
    }
  };

  const handleUpdateEquation = (index: number, equation: Equation) => {
    if (slide.content.type === 'equation') {
      const equations = slide.content.content.equations.map((eq, i) => 
        i === index ? equation : eq
      );
      onUpdate({
        ...slide,
        content: {
          type: 'equation',
          content: { equations }
        }
      });
    }
  };

  const handleDeleteEquation = (index: number) => {
    if (slide.content.type === 'equation') {
      const equations = slide.content.content.equations.filter((_, i) => i !== index);
      onUpdate({
        ...slide,
        content: {
          type: 'equation',
          content: { equations }
        }
      });
    }
  };

  const handleAddQuestion = (type: 'quiz' | 'image-quiz') => {
    const newQuestion: MultipleChoice = {
      id: Math.random().toString(36).substr(2, 9),
      question: '',
      choices: [],
      type: 'basic',
      explanation: ''
    };

    setEditingQuestion(newQuestion);
    setShowQuizDialog(true);

    if (type === 'quiz') {
      onUpdate({
        ...slide,
        content: {
          type: 'quiz',
          content: {
            questions: [
              ...(slide.content.type === 'quiz' ? slide.content.content.questions : []),
              newQuestion
            ]
          }
        }
      });
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (slide.content.type === 'quiz') {
      // Remove question from quiz slide
      onUpdate({
        ...slide,
        content: {
          type: 'quiz',
          content: {
            questions: slide.content.content.questions.filter(q => q.id !== questionId)
          }
        }
      });
    } else if (slide.content.type === 'image') {
      // Remove question from image slide
      onUpdate({
        ...slide,
        content: {
          type: 'image',
          content: {
            ...slide.content.content,
            questions: (slide.content.content.questions || []).filter(q => q.id !== questionId)
          }
        }
      });
    }
    setShowQuizDialog(false);
  };

  const handleQuestionUpdate = (updatedQuestion: MultipleChoice) => {
    if (slide.content.type === 'quiz') {
      // Update quiz content
      const questions = slide.content.content.questions.map(q =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      );
      onUpdate({
        ...slide,
        content: {
          type: 'quiz',
          content: { questions }
        }
      });
    } else if (slide.content.type === 'image') {
      // Update image questions
      const existingQuestions = slide.content.content.questions || [];
      const questionIndex = existingQuestions.findIndex(q => q.id === updatedQuestion.id);
      
      let newQuestions;
      if (questionIndex === -1) {
        // Add new question
        newQuestions = [...existingQuestions, updatedQuestion];
      } else {
        // Update existing question
        newQuestions = existingQuestions.map(q =>
          q.id === updatedQuestion.id ? updatedQuestion : q
        );
      }

      onUpdate({
        ...slide,
        content: {
          type: 'image',
          content: {
            ...slide.content.content,
            questions: newQuestions
          }
        }
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file is too large. Please use an image under 5MB.");
        setUploading(false);
        return;
      }
      
      // Convert to Base64 to display immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const updatedContent = { 
          ...slide.content.content as ImageContent,
          url: base64data
        };
        
        onUpdate({
          ...slide,
          content: {
            ...slide.content,
            content: updatedContent
          }
        });
        
        setUploading(false);
        toast.success("Image uploaded successfully");
      };
      
      reader.onerror = () => {
        console.error("Error reading file");
        toast.error("Failed to read the image file");
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
      setUploading(false);
    }
  };

  const handleEditQuestion = (question: MultipleChoice) => {
    setEditingQuestion(question);
    setShowQuizDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <div className="space-y-4">
        <div>
          <Label>Slide Title</Label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              onUpdate({ ...slide, title: e.target.value });
            }}
            placeholder="Enter slide title..."
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-chatbot">Enable AI Chatbot for this slide</Label>
          <Switch
            id="enable-chatbot"
            checked={slide.chatbotEnabled !== false}
            onCheckedChange={(checked) => {
              onUpdate({ ...slide, chatbotEnabled: checked });
            }}
          />
        </div>
      </div>

      {/* Content editing area */}
      <div className="space-y-4">
        {/* Content type selector */}
        <div className="flex items-center justify-between">
          <Label>Content Type</Label>
          <Select
            value={slide.content.type}
            onValueChange={(value: 'markdown' | 'image' | 'quiz' | 'equation') => {
              let newContent;
              switch (value) {
                case 'markdown':
                  newContent = { type: 'markdown', content: { text: '' } };
                  break;
                case 'image':
                  newContent = { type: 'image', content: { url: '', questions: [] } };
                  break;
                case 'quiz':
                  newContent = { type: 'quiz', content: { questions: [] } };
                  break;
                case 'equation':
                  newContent = { type: 'equation', content: { equations: [] } };
                  break;
              }
              onUpdate({ ...slide, content: newContent });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">Text/Markdown</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="equation">Equation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content editor */}
        {slide.content.type === 'markdown' && (
          <Card className="p-4 space-y-2">
            <Label>Content</Label>
            <Textarea
              value={slide.content.content.text}
              onChange={(e) => 
                onUpdate({
                  ...slide,
                  content: {
                    type: 'markdown',
                    content: { text: e.target.value }
                  }
                })
              }
              placeholder="Enter your content using markdown..."
              className="min-h-[200px] font-mono"
            />
            <div className="text-xs text-muted-foreground">
              Markdown formatting supported: **bold**, *italic*, [links](url), - lists, etc.
            </div>
          </Card>
        )}

        {slide.content.type === 'image' && (
          <div className="space-y-4">
            {slide.content.content.url ? (
              <div className="relative rounded-lg overflow-hidden bg-black/5">
                <img 
                  src={slide.content.content.url} 
                  alt="Content" 
                  className="max-h-[300px] w-full object-contain"
                />
                <Button
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => handleAddQuestion('image-quiz')}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Question
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <div className={cn(
                  "h-[200px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg",
                  "hover:bg-muted/50 transition-colors"
                )}>
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Click to upload an image</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </div>
              </label>
            )}

            {/* Image Questions List */}
            {slide.content.content.questions && slide.content.content.questions.length > 0 && (
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Questions</h3>
                </div>
                {slide.content.content.questions.map((question, index) => (
                  <div key={question.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <p className="text-sm text-muted-foreground">{question.question || 'No question text'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQuestion(question)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {slide.content.type === 'quiz' && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Quiz Questions</Label>
              <Button onClick={() => handleAddQuestion('quiz')}>
                <Plus className="h-4 w-4 mr-2" /> Add Question
              </Button>
            </div>
            {slide.content.content.questions.map((question, index) => (
              <div key={question.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  <p className="text-sm text-muted-foreground">{question.question}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditQuestion(question)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        )}

        {slide.content.type === 'equation' && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Equations</Label>
              <Button onClick={handleAddEquation}>
                <Plus className="h-4 w-4 mr-2" /> Add Equation
              </Button>
            </div>
            {slide.content.content.equations.map((equation, index) => (
              <Card key={index} className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Equation {index + 1}</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteEquation(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <EquationEditor
                  equation={equation}
                  onChange={(eq) => handleUpdateEquation(index, eq)}
                />
              </Card>
            ))}
          </Card>
        )}

        {/* Quiz Question Dialog */}
        {showQuizDialog && editingQuestion && (
          <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editingQuestion.id ? 'Edit Question' : 'Add Question'}</DialogTitle>
                <DialogDescription>
                  Create or modify your question and set the correct answer.
                </DialogDescription>
              </DialogHeader>
              <MultipleChoiceEditor
                question={editingQuestion}
                onChange={handleQuestionUpdate}
                onDelete={() => {
                  handleDeleteQuestion(editingQuestion.id);
                  setShowQuizDialog(false);
                }}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowQuizDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowQuizDialog(false)}>
                  Save Question
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Goals */}
      <div>
        <Label className="mb-2 block">Associated Goals</Label>
        <Card className="p-4 space-y-2">
          {availableGoals.map(goal => (
            <div key={goal.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={slide.goals.some(g => g.id === goal.id)}
                onChange={(e) => {
                  const goals = e.target.checked
                    ? [...slide.goals, goal]
                    : slide.goals.filter(g => g.id !== goal.id);
                  onUpdate({ ...slide, goals });
                }}
              />
              <span>{goal.description}</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onClose}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
