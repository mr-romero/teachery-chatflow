import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { EquationEditor } from './equation';
import { MultipleChoice, Choice, Equation } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { ChoiceFormatSelect, getDefaultChoices, ChoiceFormat } from './ChoiceFormatSelect';
import { cn } from '@/lib/utils';

interface MultipleChoiceEditorProps {
  question: MultipleChoice;
  onChange: (question: MultipleChoice) => void;
  onDelete?: () => void;
}

export function MultipleChoiceEditor({
  question,
  onChange,
  onDelete
}: MultipleChoiceEditorProps) {
  const [choiceFormat, setChoiceFormat] = React.useState<ChoiceFormat>('letters');
  const [showLatexAnswer, setShowLatexAnswer] = React.useState(false);

  const handleFormatChange = (format: ChoiceFormat) => {
    setChoiceFormat(format);
    // Reset choices with new format
    const newChoices = getDefaultChoices(format);
    onChange({
      ...question,
      choices: newChoices
    });
  };

  const handleChoiceUpdate = (index: number, updates: Partial<Choice>) => {
    const newChoices = [...question.choices];
    newChoices[index] = { ...newChoices[index], ...updates };
    onChange({ ...question, choices: newChoices });
  };

  const handleAddChoice = () => {
    if (choiceFormat !== 'custom') return;

    const newChoice: Choice = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      isCorrect: false,
      label: String(question.choices.length + 1)
    };
    onChange({
      ...question,
      choices: [...question.choices, newChoice]
    });
  };

  const handleRemoveChoice = (index: number) => {
    if (choiceFormat !== 'custom') return;

    const newChoices = question.choices.filter((_, i) => i !== index);
    // Relabel remaining choices
    newChoices.forEach((choice, i) => {
      choice.label = String(i + 1);
    });
    onChange({
      ...question,
      choices: newChoices
    });
  };

  React.useEffect(() => {
    // Initialize with default choices if none exist
    if (question.choices.length === 0) {
      onChange({
        ...question,
        choices: getDefaultChoices(choiceFormat)
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Question</Label>
        <Textarea
          value={question.question}
          onChange={(e) => onChange({ ...question, question: e.target.value })}
          placeholder="Enter your question..."
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Choice Format</Label>
          <ChoiceFormatSelect
            value={choiceFormat}
            onValueChange={handleFormatChange}
          />
        </div>

        <div className="space-y-2">
          {question.choices.map((choice, index) => (
            <div key={choice.id} className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "w-12 h-12 text-base font-medium",
                  choice.isCorrect && "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                )}
                onClick={() => {
                  const newChoices = question.choices.map((c, i) => ({
                    ...c,
                    isCorrect: i === index
                  }));
                  onChange({ ...question, choices: newChoices });
                }}
              >
                {choice.label}
              </Button>
              <Input
                value={choice.text}
                onChange={(e) => handleChoiceUpdate(index, { text: e.target.value })}
                placeholder={`Choice ${index + 1}`}
                className="flex-1"
              />
              {choiceFormat === 'custom' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveChoice(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {choiceFormat === 'custom' && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleAddChoice}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Choice
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Answer Type</Label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant={showLatexAnswer ? "outline" : "default"}
            onClick={() => setShowLatexAnswer(false)}
          >
            Text
          </Button>
          <Button
            type="button"
            variant={showLatexAnswer ? "default" : "outline"}
            onClick={() => setShowLatexAnswer(true)}
          >
            LaTeX
          </Button>
        </div>

        {showLatexAnswer ? (
          <EquationEditor
            equation={{
              latex: question.latexAnswer || '',
              displayMode: true
            }}
            onChange={(eq) => {
              onChange({
                ...question,
                latexAnswer: eq.latex
              });
            }}
          />
        ) : (
          <Textarea
            value={question.explanation || ''}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
            placeholder="Enter an explanation for the correct answer..."
            className="min-h-[100px]"
          />
        )}
      </div>
    </div>
  );
}
