
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, X, FileImage, FilePdf, FileText } from 'lucide-react';
import { SlideContent } from './SlideViewer';

interface SlideEditorProps {
  slide: SlideContent;
  onUpdate: (slide: SlideContent) => void;
  onClose: () => void;
}

const SlideEditor = ({ slide, onUpdate, onClose }: SlideEditorProps) => {
  const [editedSlide, setEditedSlide] = useState<SlideContent>(slide);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>(
    slide.multipleChoice?.options || ['', '', '', '']
  );
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(
    slide.multipleChoice?.correctAnswer || 0
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and PDF files are supported');
      return;
    }

    setFileUpload(file);
    
    // Create URL for preview
    const fileUrl = URL.createObjectURL(file);
    setEditedSlide({
      ...editedSlide,
      type: file.type === 'application/pdf' ? 'pdf' : 'image',
      content: fileUrl,
    });
  };

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedSlide({
      ...editedSlide,
      content: e.target.value,
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...multipleChoiceOptions];
    updatedOptions[index] = value;
    setMultipleChoiceOptions(updatedOptions);
  };

  const addMultipleChoice = () => {
    setEditedSlide({
      ...editedSlide,
      multipleChoice: {
        question: 'Question?',
        options: multipleChoiceOptions,
        correctAnswer: correctAnswerIndex,
      },
    });
  };

  const removeMultipleChoice = () => {
    const { multipleChoice, ...rest } = editedSlide;
    setEditedSlide(rest);
  };

  const addEquation = () => {
    setEditedSlide({
      ...editedSlide,
      equation: {
        question: 'Solve this equation:',
        answer: '',
      },
    });
  };

  const updateEquation = (field: 'question' | 'answer', value: string) => {
    if (!editedSlide.equation) return;
    
    setEditedSlide({
      ...editedSlide,
      equation: {
        ...editedSlide.equation,
        [field]: value,
      },
    });
  };

  const removeEquation = () => {
    const { equation, ...rest } = editedSlide;
    setEditedSlide(rest);
  };

  const handleSave = () => {
    onUpdate(editedSlide);
    onClose();
    toast.success('Slide updated successfully');
  };

  return (
    <div className="bg-white rounded-lg border shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">Edit Slide</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <Tabs defaultValue={editedSlide.type} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="image" className="flex items-center">
              <FileImage className="mr-2 h-4 w-4" />
              Image
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center">
              <FilePdf className="mr-2 h-4 w-4" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="markdown" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Markdown
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="image" className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="image">Upload Image (JPG, PNG)</Label>
              <Input id="image" type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
            </div>
            
            {editedSlide.type === 'image' && editedSlide.content && (
              <div className="max-h-40 overflow-hidden rounded border">
                <img 
                  src={editedSlide.content} 
                  alt="Preview" 
                  className="w-full object-contain"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pdf" className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="pdf">Upload PDF</Label>
              <Input id="pdf" type="file" accept=".pdf" onChange={handleFileChange} />
            </div>
            
            {editedSlide.type === 'pdf' && editedSlide.content && (
              <div className="text-sm text-muted-foreground">
                PDF selected: {fileUpload?.name || 'document.pdf'}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="markdown" className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="markdown">Markdown Content</Label>
              <Textarea 
                id="markdown" 
                value={editedSlide.type === 'markdown' ? editedSlide.content : ''} 
                onChange={handleMarkdownChange}
                className="min-h-[200px] font-mono"
                placeholder="# Title
                
## Subtitle

Content goes here..."
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Additional Components</h4>
          </div>
          
          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h5 className="text-sm font-medium">Multiple Choice Question</h5>
              {editedSlide.multipleChoice ? (
                <Button variant="destructive" size="sm" onClick={removeMultipleChoice}>
                  Remove
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={addMultipleChoice}>
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              )}
            </div>
            
            {editedSlide.multipleChoice && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="question">Question</Label>
                  <Input 
                    id="question" 
                    value={editedSlide.multipleChoice.question} 
                    onChange={(e) => setEditedSlide({
                      ...editedSlide,
                      multipleChoice: {
                        ...editedSlide.multipleChoice!,
                        question: e.target.value
                      }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Options</Label>
                  {multipleChoiceOptions.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={idx === correctAnswerIndex}
                          onChange={() => setCorrectAnswerIndex(idx)}
                          className="rounded-full"
                        />
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <h5 className="text-sm font-medium">Equation Answer Key</h5>
              {editedSlide.equation ? (
                <Button variant="destructive" size="sm" onClick={removeEquation}>
                  Remove
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={addEquation}>
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              )}
            </div>
            
            {editedSlide.equation && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="eq-question">Question</Label>
                  <Input 
                    id="eq-question" 
                    value={editedSlide.equation.question} 
                    onChange={(e) => updateEquation('question', e.target.value)}
                  />
                </div>
                
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="eq-answer">Answer Key</Label>
                  <Input 
                    id="eq-answer" 
                    value={editedSlide.equation.answer} 
                    onChange={(e) => updateEquation('answer', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default SlideEditor;
