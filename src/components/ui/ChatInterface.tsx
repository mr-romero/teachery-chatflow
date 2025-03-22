import React, { useState } from 'react';
import { Goal } from '@/types';
import { Button } from './button';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sendChatMessage } from '@/lib/api';

interface ChatInterfaceProps {
  goals: Goal[];
  isPaused: boolean;
  onGoalComplete: (goalId: string) => void;
  systemPrompt?: string;
  showTyping?: boolean;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export function ChatInterface({
  goals,
  isPaused,
  onGoalComplete,
  systemPrompt = "You are a helpful teaching assistant.",
  showTyping = true
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const generateAssistantPrompt = () => {
    let prompt = systemPrompt + "\n\n";
    prompt += "The current learning goals are:\n";
    goals.forEach(goal => {
      prompt += `- ${goal.description}\n`;
    });
    prompt += "\nHelp the student achieve these goals. Mark a goal as completed when you're confident the student understands it by mentioning [GOAL_COMPLETED:<goal_id>] in your response.";
    return prompt;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isPaused) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      // Format conversation history for API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Add system prompt at the start
      const apiMessages = [
        {
          role: 'system',
          content: generateAssistantPrompt()
        },
        ...history,
        {
          role: 'user',
          content: input.trim()
        }
      ];

      // Make API call
      const response = await sendChatMessage(apiMessages);
      
      // Process the response
      const content = response.message;
      
      // Check for completed goals
      const goalRegex = /\[GOAL_COMPLETED:([^\]]+)\]/g;
      let match;
      while ((match = goalRegex.exec(content)) !== null) {
        const goalId = match[1];
        onGoalComplete(goalId);
        toast.success('Learning goal completed!');
      }

      // Clean up response and update chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: content.replace(goalRegex, '').trim(),
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
      scrollToBottom();

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Unable to reach the teaching assistant. Please try again.');
      
      // Add error message to chat
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-full rounded-lg border bg-white",
        isPaused && "opacity-50"
      )}
      aria-live="polite"
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={`${message.timestamp}-${index}`}
            className={cn(
              "flex flex-col space-y-2 p-4 rounded-lg",
              message.role === 'assistant' 
                ? "bg-primary/5 mr-12" 
                : "bg-muted/20 ml-12"
            )}
          >
            <div className="text-xs font-medium text-muted-foreground">
              {message.role === 'assistant' ? 'Teaching Assistant' : 'You'}
            </div>
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            <div className="text-[10px] text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center justify-center space-x-2 p-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isPaused ? "Chat is paused..." : "Ask a question..."}
            disabled={isPaused || isLoading}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            aria-label="Chat input"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isPaused || isLoading}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
