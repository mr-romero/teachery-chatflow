
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
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
  className?: string;
}

const ChatWindow = ({ goals, onGoalCompleted, isPaused, className }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
          role: 'assistant',
          content: `Welcome! Today's learning goals are:\n${goalsList}\n\nHow can I help you with these goals?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [goals]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isPaused) return;
    
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

    // Simulate AI response
    setTimeout(() => {
      // Check if message completes any goals (simplified logic)
      let completedGoalId: string | null = null;
      let responseText = '';
      
      // Very simple simulation of goal checking (in real app, use actual NLP)
      goals.forEach(goal => {
        if (!goal.completed && userMessage.content.toLowerCase().includes(goal.description.toLowerCase())) {
          completedGoalId = goal.id;
          responseText = `Great job! You've demonstrated your understanding of "${goal.description}". That goal is now complete!`;
        }
      });
      
      if (!completedGoalId) {
        responseText = "That's a good response! Keep working on the goals. Let me know if you need any help.";
      } else {
        onGoalCompleted(completedGoalId);
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
  };

  return (
    <div className={cn("flex flex-col h-full rounded-lg border overflow-hidden bg-white", className)}>
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-medium">Learning Assistant</h3>
        {isPaused && (
          <div className="mt-1 text-sm text-muted-foreground animate-pulse">
            Chat paused by teacher
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
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
