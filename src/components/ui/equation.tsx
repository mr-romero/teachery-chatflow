import React, { useEffect } from 'react';
import { Textarea } from './textarea';
import { Button } from './button';
import { Equation } from '@/types';
import { Label } from './label';
import { Card } from './card';
import { Alert, AlertTitle, AlertDescription } from './alert';

interface EquationEditorProps {
  equation: Equation;
  onChange: (equation: Equation) => void;
  onDelete?: () => void;
  preview?: boolean;
}

export function EquationEditor({ equation, onChange, onDelete, preview = false }: EquationEditorProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isKatexLoaded, setIsKatexLoaded] = React.useState(false);

  useEffect(() => {
    // Check if KaTeX is already available
    if (typeof window !== 'undefined' && (window as any).katex) {
      setIsKatexLoaded(true);
      return;
    }

    // Load KaTeX CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    link.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // Load KaTeX JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    script.integrity = 'sha384-XjKyOOlGwcjNTAZQwGMyse5Ht8g3t9zOmxjJ/ZjheX4vvJsOWECWTq8DLtBRS3e';
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.onload = () => {
      setIsKatexLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // Clean up only the script we added (leave CSS for caching)
      document.head.removeChild(script);
    };
  }, []);

  const updateEquation = (updates: Partial<Equation>) => {
    onChange({
      ...equation,
      ...updates
    });
  };

  const renderLatex = (latex: string) => {
    if (!isKatexLoaded) return { __html: latex };

    try {
      const katex = (window as any).katex;
      const html = katex.renderToString(latex, {
        throwOnError: true,
        displayMode: equation.displayMode
      });
      setError(null);
      return { __html: html };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      return { __html: latex };
    }
  };

  if (preview) {
    return (
      <div className="space-y-4">
        {equation.question && (
          <p className="text-sm font-medium">{equation.question}</p>
        )}
        <div 
          dangerouslySetInnerHTML={renderLatex(equation.latex)} 
          className="py-2"
        />
        {equation.answer && (
          <div className="text-sm text-muted-foreground">
            Answer: {equation.answer}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Question (Optional)</Label>
        <Textarea
          value={equation.question || ''}
          onChange={(e) => updateEquation({ question: e.target.value })}
          placeholder="Enter a question about this equation..."
          className="h-20"
        />
      </div>

      <div className="space-y-2">
        <Label>LaTeX Equation</Label>
        <Textarea
          value={equation.latex}
          onChange={(e) => {
            setError(null);
            updateEquation({ latex: e.target.value });
          }}
          placeholder="Enter LaTeX equation..."
          className="font-mono h-24"
        />
        {error && (
          <Alert variant="destructive">
            <AlertTitle>LaTeX Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label>Answer (Optional)</Label>
        <Textarea
          value={equation.answer || ''}
          onChange={(e) => updateEquation({ answer: e.target.value })}
          placeholder="Enter the answer..."
          className="h-20"
        />
      </div>

      <div className="space-y-2">
        <Label>Explanation (Optional)</Label>
        <Textarea
          value={equation.explanation || ''}
          onChange={(e) => updateEquation({ explanation: e.target.value })}
          placeholder="Explain how to solve this..."
          className="h-20"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => updateEquation({ displayMode: !equation.displayMode })}
        >
          {equation.displayMode ? "Inline Mode" : "Display Mode"}
        </Button>
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
          >
            Delete Equation
          </Button>
        )}
      </div>

      {equation.latex && (
        <div className="mt-4 p-4 bg-muted/20 rounded-lg">
          <div className="text-sm font-medium mb-2">Preview:</div>
          {!isKatexLoaded ? (
            <div className="text-sm text-muted-foreground">
              Loading equation renderer...
            </div>
          ) : (
            <div 
              dangerouslySetInnerHTML={renderLatex(equation.latex)} 
              className="py-2"
            />
          )}
        </div>
      )}
    </Card>
  );
}

export default EquationEditor;
