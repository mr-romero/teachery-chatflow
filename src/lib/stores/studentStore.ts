import { StudentSession } from '@/types';
import { api } from '../api';

class StudentStore {
  private readonly SESSION_PREFIX = 'teachery_student_session_';
  private lastServerCallTime: Record<string, number> = {}; // Keep track of API call time by lesson ID
  private shouldTryServerAgain: Record<string, boolean> = {}; // Track if server call should be attempted

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

  async createSession(studentName: string, lessonId: string): Promise<StudentSession> {
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

    // Save locally
    this.saveSession(session);
    
    // Save to server
    try {
      await api.post('/sessions/save', { session });
      // Reset server connectivity state for this lesson
      this.shouldTryServerAgain[lessonId] = true;
    } catch (error) {
      console.error('Failed to save session to server:', error);
    }
    
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

  async saveSession(session: StudentSession) {
    const key = `${this.SESSION_PREFIX}${session.studentId}`;
    const validatedSession = this.ensureValidSession(session);
    localStorage.setItem(key, JSON.stringify(validatedSession));
    
    // Only try to save to server if we haven't disabled server calls for this lesson
    if (this.shouldTryServerAgain[session.lessonId] !== false) {
      try {
        await api.post('/sessions/save', { session: validatedSession });
        // Reset server connectivity state for this lesson
        this.shouldTryServerAgain[session.lessonId] = true;
      } catch (error) {
        console.error('Failed to save session to server:', error);
        // After a failure, set a cool-down period before trying server again
        this.shouldTryServerAgain[session.lessonId] = false;
        setTimeout(() => {
          this.shouldTryServerAgain[session.lessonId] = true;
        }, 30000); // Try again after 30 seconds
      }
    }
  }

  async getSession(studentId: string): Promise<StudentSession | null> {
    try {
      // First try to get from local storage
      const key = `${this.SESSION_PREFIX}${studentId}`;
      const localData = localStorage.getItem(key);
      
      if (localData) {
        const session = JSON.parse(localData) as StudentSession;
        const validatedSession = this.ensureValidSession(session);
        
        // If connected to server and we should try server call
        if (this.shouldTryServerAgain[validatedSession.lessonId] !== false) {
          try {
            // Get from server only if we haven't disabled server calls
            const response = await api.get(`/sessions/${studentId}`);
            if (response.status === 200 && response.data.session) {
              const serverSession = response.data.session;
              // Save to local storage for future use
              localStorage.setItem(key, JSON.stringify(serverSession));
              return this.ensureValidSession(serverSession);
            }
          } catch (error) {
            // Just log and continue with local data
            console.error('Error getting session from server, using local data:', error);
            
            // After a failure, set a cool-down period before trying server again
            this.shouldTryServerAgain[validatedSession.lessonId] = false;
            setTimeout(() => {
              this.shouldTryServerAgain[validatedSession.lessonId] = true;
            }, 30000); // Try again after 30 seconds
          }
        }
        
        return validatedSession;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async updateSession(studentId: string, updates: Partial<StudentSession>) {
    const session = await this.getSession(studentId);
    if (!session) return;

    const updatedSession = this.ensureValidSession({
      ...session,
      ...updates
    });

    await this.saveSession(updatedSession);
  }

  async getActiveStudents(lessonId: string): Promise<StudentSession[]> {
    const now = Date.now();
    
    // Get local sessions
    const localSessions = Object.keys(localStorage)
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
      
    // Only try server if we haven't disabled it for this lesson and if enough time has passed
    const shouldCallServer = this.shouldTryServerAgain[lessonId] !== false && 
      (!this.lastServerCallTime[lessonId] || now - this.lastServerCallTime[lessonId] > 5000); // Limit to every 5 seconds
    
    if (shouldCallServer) {
      this.lastServerCallTime[lessonId] = now;
      try {
        const response = await api.get(`/sessions/active/${lessonId}`);
        if (response.status === 200 && Array.isArray(response.data.sessions)) {
          const serverSessions = response.data.sessions.map((session: StudentSession) => 
            this.ensureValidSession(session)
          );
          
          // Merge sessions, preferring local ones
          const localSessionIds = new Set(localSessions.map(s => s.studentId));
          const uniqueServerSessions = serverSessions.filter(s => !localSessionIds.has(s.studentId));
          
          return [...localSessions, ...uniqueServerSessions];
        }
      } catch (error) {
        console.error('Failed to fetch active students from server:', error);
        
        // If we get a 404, don't try again for a while
        if (error instanceof Error && error.message.includes('404')) {
          this.shouldTryServerAgain[lessonId] = false;
          setTimeout(() => {
            this.shouldTryServerAgain[lessonId] = true;
          }, 60000); // Try again after 1 minute
        }
      }
    }
    
    return localSessions;
  }

  async endSession(studentId: string) {
    const key = `${this.SESSION_PREFIX}${studentId}`;
    const sessionData = localStorage.getItem(key);
    let lessonId = '';
    
    // Extract the lesson ID before removing from local storage
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData) as StudentSession;
        lessonId = session.lessonId;
      } catch (error) {
        console.error('Error parsing session data:', error);
      }
    }
    
    localStorage.removeItem(key);
    
    // Only try server if we haven't disabled it for this lesson
    if (lessonId && this.shouldTryServerAgain[lessonId] !== false) {
      try {
        await api.delete(`/sessions/${studentId}`);
      } catch (error) {
        console.error('Failed to delete session from server:', error);
        
        // After a failure, set a cool-down period before trying server again
        this.shouldTryServerAgain[lessonId] = false;
        setTimeout(() => {
          this.shouldTryServerAgain[lessonId] = true;
        }, 30000); // Try again after 30 seconds
      }
    }
  }

  async addCompletedGoal(studentId: string, goalId: string) {
    const session = await this.getSession(studentId);
    if (!session) return;

    const updatedSession = this.ensureValidSession(session);
    if (!updatedSession.completedGoals.includes(goalId)) {
      updatedSession.completedGoals.push(goalId);
      await this.saveSession(updatedSession);
    }
  }

  async addResponse(studentId: string, slideId: string, response: {
    answer: string;
    isCorrect: boolean;
    feedback?: string;
  }) {
    const session = await this.getSession(studentId);
    if (!session) return;

    const updatedSession = this.ensureValidSession(session);
    if (!updatedSession.responses[slideId]) {
      updatedSession.responses[slideId] = [];
    }

    updatedSession.responses[slideId].push({
      ...response,
      timestamp: Date.now()
    });

    await this.saveSession(updatedSession);
  }
}

export const studentStore = new StudentStore();
