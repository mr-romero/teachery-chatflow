import { StudentSession } from '@/types';

class StudentStore {
  private readonly SESSION_PREFIX = 'teachery_student_session_';

  constructor() {
    // Clean up old sessions on init
    this.cleanupStaleSessions();
  }

  cleanupStaleSessions(): void {
    const now = Date.now();
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.SESSION_PREFIX))
      .forEach(key => {
        try {
          const session = JSON.parse(localStorage.getItem(key) || '');
          if (now - session.lastActive > 30000) { // 30 seconds timeout
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      });
  }

  createSession(studentName: string, lessonId: string): StudentSession {
    const studentId = `student_${Math.random().toString(36).substr(2, 9)}`;
    const session: StudentSession = {
      studentId,
      studentName,
      lessonId,
      lastActive: Date.now(),
      currentSlide: 0,
      completedGoals: [], // Initialize as empty array
      responses: {}
    };

    this.saveSession(session);
    return session;
  }

  private ensureValidSession(session: StudentSession): StudentSession {
    return {
      ...session,
      completedGoals: Array.isArray(session.completedGoals) ? session.completedGoals : [],
      responses: session.responses || {},
      lastActive: Date.now()
    };
  }

  saveSession(session: StudentSession) {
    const key = `${this.SESSION_PREFIX}${session.studentId}`;
    const validatedSession = this.ensureValidSession(session);
    localStorage.setItem(key, JSON.stringify(validatedSession));
  }

  getSession(studentId: string): StudentSession | null {
    try {
      const key = `${this.SESSION_PREFIX}${studentId}`;
      const data = localStorage.getItem(key);
      if (!data) return null;

      const session = JSON.parse(data) as StudentSession;
      return this.ensureValidSession(session);
    } catch {
      return null;
    }
  }

  updateSession(studentId: string, updates: Partial<StudentSession>) {
    const session = this.getSession(studentId);
    if (!session) return;

    const updatedSession = this.ensureValidSession({
      ...session,
      ...updates
    });

    this.saveSession(updatedSession);
  }

  getActiveStudents(lessonId: string): StudentSession[] {
    const now = Date.now();
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.SESSION_PREFIX))
      .map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '');
          return this.ensureValidSession(data as StudentSession);
        } catch {
          return null;
        }
      })
      .filter((session): session is StudentSession => 
        session !== null && 
        session.lessonId === lessonId &&
        now - session.lastActive < 10000 // 10 seconds timeout
      );
  }

  endSession(studentId: string) {
    const key = `${this.SESSION_PREFIX}${studentId}`;
    localStorage.removeItem(key);
  }

  addCompletedGoal(studentId: string, goalId: string) {
    const session = this.getSession(studentId);
    if (!session) return;

    const updatedSession = this.ensureValidSession(session);
    if (!updatedSession.completedGoals.includes(goalId)) {
      updatedSession.completedGoals.push(goalId);
      this.saveSession(updatedSession);
    }
  }

  addResponse(studentId: string, slideId: string, response: {
    answer: string;
    isCorrect: boolean;
    feedback?: string;
  }) {
    const session = this.getSession(studentId);
    if (!session) return;

    const updatedSession = this.ensureValidSession(session);
    if (!updatedSession.responses[slideId]) {
      updatedSession.responses[slideId] = [];
    }

    updatedSession.responses[slideId].push({
      ...response,
      timestamp: Date.now()
    });

    this.saveSession(updatedSession);
  }
}

export const studentStore = new StudentStore();
