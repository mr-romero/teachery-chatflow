import React from 'react';
import { Card } from './card';
import { Button } from './button';
import { Label } from './label';
import { MultipleChoice } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { MultipleChoiceEditor } from './MultipleChoiceEditor';
import { toast } from 'sonner';

interface ImageQuestionEditorProps {
  questions: MultipleChoice[];
  onChange: (questions: MultipleChoice[]) => void;
  disabled?: boolean;
}

export function ImageQuestionEditor({
  questions,
  onChange,
  disabled = false
}: ImageQuestionEditorProps) {
  const [editingQuestion, setEditingQuestion] = React.useState<MultipleChoice | null>(null);
  const [showDialog, setShowDialog] = React.useState(false);
  const [pendingChanges, setPendingChanges] = React.useState<MultipleChoice | null>(null);

  const handleAddQuestion = () => {
    const newQuestion: MultipleChoice = {
      id: Math.random().toString(36).substr(2, 9),
      question: '',
      choices: [],
      type: 'basic'
    };
    setEditingQuestion(newQuestion);
    setPendingChanges(newQuestion);
    setShowDialog(true);
  };

  const handleQuestionUpdate = (updatedQuestion: MultipleChoice) => {
    setPendingChanges(updatedQuestion);
  };

  const handleSaveChanges = () => {
    if (!pendingChanges) return;
    
    if (!pendingChanges.question.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (pendingChanges.choices.length < 2) {
      toast.error('At least two choices are required');
      return;
    }

    if (!pendingChanges.choices.some(c => c.isCorrect)) {
      toast.error('Please mark one answer as correct');
      return;
    }

    const existingIndex = questions.findIndex(q => q.id === pendingChanges.id);
    if (existingIndex === -1) {
      // New question
      onChange([...questions, pendingChanges]);
    } else {
      // Update existing
      onChange(questions.map(q => 
        q.id === pendingChanges.id ? pendingChanges : q
      ));
    }

    handleCloseDialog();
    toast.success(existingIndex === -1 ? 'Question added' : 'Question updated');
  };

  const handleQuestionDelete = (questionId: string) => {
    onChange(questions.filter(q => q.id !== questionId));
    handleCloseDialog();
    toast.success('Question deleted');
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingQuestion(null);
    setPendingChanges(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Questions</Label>
        <Button
          onClick={handleAddQuestion}
          disabled={disabled}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Question
        </Button>
      </div>

      {questions.length > 0 ? (
        <div className="space-y-2">
          {questions.map((question, index) => (
            <Card key={question.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Question {index + 1}</h4>
                  <p className="text-sm text-muted-foreground">{question.question || 'No question text'}</p>
                  <p className="text-xs text-muted-foreground">
                    {question.choices.length} choices • {question.choices.filter(c => c.isCorrect).length} correct
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingQuestion(question);
                      setPendingChanges(question);
                      setShowDialog(true);
                    }}
                    disabled={disabled}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuestionDelete(question.id)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground p-4">
          No questions added yet
        </p>
      )}

      {showDialog && editingQuestion && (
        <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {questions.some(q => q.id === editingQuestion.id) ? 'Edit' : 'Add'} Question
              </DialogTitle>
            </DialogHeader>
            <MultipleChoiceEditor
              question={editingQuestion}
              onChange={handleQuestionUpdate}
              onDelete={() => handleQuestionDelete(editingQuestion.id)}
              disabled={disabled}
            />
            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSaveChanges}>
                {questions.some(q => q.id === editingQuestion.id) ? 'Update' : 'Add'} Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
