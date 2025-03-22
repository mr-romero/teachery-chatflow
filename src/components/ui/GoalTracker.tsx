import React from 'react';
import { Goal } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  completedGoals: string[];
}

interface GoalTrackerProps {
  goals: Goal[];
  students: Student[];
  mode?: 'teacher' | 'student';
  className?: string;
}

export function GoalTracker({
  goals,
  students,
  mode = 'teacher',
  className
}: GoalTrackerProps) {
  const goalCompletion = goals.map(goal => {
    const completedCount = students.filter(student => 
      Array.isArray(student.completedGoals) && 
      student.completedGoals.includes(goal.id)
    ).length;
    const percentage = students.length ? (completedCount / students.length) * 100 : 0;
    return {
      ...goal,
      completedCount,
      percentage
    };
  });

  const studentProgress = students.map(student => {
    if (!Array.isArray(student.completedGoals)) {
      return {
        ...student,
        completedCount: 0,
        percentage: 0
      };
    }
    const completedCount = student.completedGoals.length;
    const percentage = goals.length ? (completedCount / goals.length) * 100 : 0;
    return {
      ...student,
      completedCount,
      percentage
    };
  });

  return (
    <div className={cn("space-y-6", className)}>
      {mode === 'teacher' ? (
        // Show per-goal completion status
        <div className="space-y-3">
          {goalCompletion.map(goal => (
            <div key={goal.id} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{goal.description}</span>
                  <span className="text-sm text-muted-foreground">
                    {goal.completedCount} of {students.length} completed
                  </span>
                </div>
                <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${goal.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Show progress for each student
        <div className="space-y-3">
          {studentProgress.map(student => (
            <div key={student.id} className="space-y-2">
              <div className="text-sm font-medium">{student.name}</div>
              <div className="grid gap-1">
                {goals.map(goal => {
                  const isCompleted = Array.isArray(student.completedGoals) && 
                    student.completedGoals.includes(goal.id);
                  return (
                    <div key={goal.id} className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">{goal.description}</span>
                    </div>
                  );
                })}
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${student.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {students.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No students connected yet
        </div>
      )}
    </div>
  );
}
