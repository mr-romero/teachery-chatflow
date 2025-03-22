
import { cn } from '@/lib/utils';
import { Check, Clock } from 'lucide-react';

export interface Goal {
  id: string;
  description: string;
  completed: boolean;
}

interface StudentProgress {
  id: string;
  name: string;
  completedGoals: string[];
}

interface GoalTrackerProps {
  goals: Goal[];
  students?: StudentProgress[];
  mode: 'teacher' | 'student';
  className?: string;
}

const GoalTracker = ({ goals, students = [], mode, className }: GoalTrackerProps) => {
  if (mode === 'student') {
    return (
      <div className={cn("rounded-lg border overflow-hidden bg-white", className)}>
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-medium">Learning Goals</h3>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            {goals.map((goal) => (
              <li key={goal.id} className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                  goal.completed 
                    ? "bg-green-100 text-green-600 ring-2 ring-green-500 ring-offset-2" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {goal.completed ? (
                    <Check size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                </div>
                <span className={cn(
                  "text-sm",
                  goal.completed && "font-medium text-green-700"
                )}>
                  {goal.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Teacher mode with student progress
  return (
    <div className={cn("rounded-lg border overflow-hidden bg-white", className)}>
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-medium">Student Progress</h3>
      </div>
      <div className="p-4 overflow-auto max-h-[calc(100%-4rem)]">
        <table className="w-full border-collapse">
          <thead className="bg-muted/30">
            <tr>
              <th className="p-2 text-left text-sm font-medium">Student</th>
              {goals.map((goal) => (
                <th key={goal.id} className="p-2 text-center text-xs font-medium">
                  <div className="max-w-[150px] truncate" title={goal.description}>
                    {goal.description}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={goals.length + 1} className="p-4 text-center text-muted-foreground">
                  No students have joined yet
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="border-b border-muted last:border-0">
                  <td className="p-2 font-medium">{student.name}</td>
                  {goals.map((goal) => {
                    const isCompleted = student.completedGoals.includes(goal.id);
                    return (
                      <td key={`${student.id}-${goal.id}`} className="p-2 text-center">
                        <div className="flex justify-center">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                            isCompleted 
                              ? "bg-green-100 text-green-600 ring-2 ring-green-500 ring-offset-2 scale-110" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {isCompleted ? (
                              <Check size={14} />
                            ) : (
                              <Clock size={14} />
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GoalTracker;
