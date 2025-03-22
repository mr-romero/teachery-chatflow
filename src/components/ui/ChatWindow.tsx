
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Goal {
  id: string;
  description: string;
  completed: boolean;
}

interface ChatWindowProps {
  goals: Goal[];
  onGoalCompleted: (goalId: string) => void;
  isPaused: boolean;
  systemPrompt?: string;
  onSystemPromptChange?: (prompt: string) => void;
  className?: string;
}

const ChatWindow = ({ 
  goals, 
  onGoalCompleted, 
  isPaused, 
  systemPrompt = "", 
  onSystemPromptChange,
  className 
}: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editedSystemPrompt, setEditedSystemPrompt] = useState(systemPrompt);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message with goals
  useEffect(() => {
    if (goals.length > 0 && messages.length === 0) {
      const goalsList = goals
        .map(goal => `- ${goal.description}`)
        .join('\n');
        
      setMessages([
        {
          id: '1',
          role: 'system',
          content: systemPrompt,
          timestamp: new Date()
        },
        {
          id: '2',
          role: 'assistant',
          content: `Welcome! Today's learning goals are:\n${goalsList}\n\nHow can I help you with these goals?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [goals, systemPrompt]);

  // Update system message when the prompt changes
  useEffect(() => {
    setEditedSystemPrompt(systemPrompt);
    setMessages(current => {
      const firstMessage = current.find(m => m.role === 'system');
      if (firstMessage) {
        return current.map(m => 
          m.id === firstMessage.id 
            ? { ...m, content: systemPrompt }
            : m
        );
      }
      return [
        {
          id: Date.now().toString(),
          role: 'system',
          content: systemPrompt,
          timestamp: new Date()
        },
        ...current
      ];
    });
  }, [systemPrompt]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isPaused || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // In a real app, this would call OpenRouter API
      // For now, we'll simulate the LLM response with a timeout
      
      setTimeout(() => {
        // Check if the message completes any goals
        let completedGoalId: string | null = null;
        const pendingGoals = goals.filter(g => !g.completed);
        
        // Simple simulation of goal checking
        pendingGoals.forEach(goal => {
          const goalKeywords = goal.description.toLowerCase().split(' ').filter(w => w.length > 3);
          const messageContainsKeywords = goalKeywords.some(keyword => 
            input.toLowerCase().includes(keyword)
          );
          
          if (!completedGoalId && messageContainsKeywords) {
            completedGoalId = goal.id;
          }
        });
        
        let responseText = '';
        
        if (completedGoalId) {
          const completedGoal = goals.find(g => g.id === completedGoalId);
          responseText = `Great job! You've demonstrated your understanding of "${completedGoal?.description}". That goal is now complete!`;
          onGoalCompleted(completedGoalId);
        } else {
          responseText = "That's a good response! Keep working on the goals. Let me know if you need any help.";
        }

        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error calling AI service:', error);
      toast.error('Failed to get a response. Please try again.');
      setIsLoading(false);
    }
  };

  const saveSystemPrompt = () => {
    if (onSystemPromptChange) {
      onSystemPromptChange(editedSystemPrompt);
      setShowSettings(false);
      toast.success('System prompt updated');
    }
  };

  const visibleMessages = messages.filter(m => m.role !== 'system');

  return (
    <div className={cn("flex flex-col h-full rounded-lg border overflow-hidden bg-white", className)}>
      <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
        <h3 className="font-medium">Learning Assistant</h3>
        <div className="flex items-center gap-2">
          {isPaused && (
            <div className="text-sm text-muted-foreground animate-pulse">
              Chat paused by teacher
            </div>
          )}
          {onSystemPromptChange && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(!showSettings)}
              title="System prompt settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {showSettings && (
        <div className="p-4 border-b bg-muted/10">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">System Prompt</h4>
            <Textarea 
              value={editedSystemPrompt} 
              onChange={(e) => setEditedSystemPrompt(e.target.value)} 
              placeholder="Enter system instructions for the AI..."
              className="min-h-[100px] text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={saveSystemPrompt}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleMessages.map((message) => (
          <div 
            key={message.id} 
            className={cn(
              "flex flex-col max-w-[85%] rounded-lg p-3 animate-slide-in",
              message.role === 'assistant' 
                ? "bg-muted mr-auto" 
                : "bg-primary text-primary-foreground ml-auto"
            )}
          >
            <div className="whitespace-pre-line text-sm">{message.content}</div>
            <div 
              className={cn(
                "text-xs mt-1 self-end",
                message.role === 'assistant' ? "text-muted-foreground" : "text-primary-foreground/70"
              )}
            >
              {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 max-w-[85%] rounded-lg p-3 bg-muted mr-auto animate-pulse">
            <div className="h-2 w-2 rounded-full bg-current"/>
            <div className="h-2 w-2 rounded-full bg-current"/>
            <div className="h-2 w-2 rounded-full bg-current"/>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isPaused ? "Chat paused by teacher" : "Type your message..."}
            disabled={isPaused || isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isPaused || isLoading || !input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
