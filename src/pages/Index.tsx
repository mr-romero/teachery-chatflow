
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  
  const handleTeacherLogin = () => {
    // In a real application, this would authenticate the teacher
    navigate('/teacher');
  };
  
  const handleStudentLogin = () => {
    if (!accessCode.trim()) {
      toast.error('Please enter an access code');
      return;
    }
    
    // For demo purposes, any code works
    navigate('/student');
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
        <div className="w-full max-w-md mx-auto p-8 rounded-lg glass animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to TeachFlow</h1>
            <p className="text-muted-foreground">
              The elegant teaching and learning platform
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-xl font-medium">For Students</h2>
              <div className="space-y-2">
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter class access code"
                />
                <Button 
                  className="w-full" 
                  onClick={handleStudentLogin}
                >
                  Join Class
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-xl font-medium">For Teachers</h2>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleTeacherLogin}
              >
                Teacher Login
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                For demonstration purposes, authentication is simplified
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
