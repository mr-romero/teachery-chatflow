import { Lesson, Slide, Goal } from '@/types';
import { api } from '../api';

export interface StoredLesson extends Omit<Lesson, 'goals'> {
  goals: Goal[];
  createdAt: number;
  currentSlide?: number; // Added for teacher-student slide sync
}

// Type guard for stored lesson
const isStoredLesson = (data: any): data is StoredLesson => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    typeof data.accessCode === 'string' &&
    Array.isArray(data.slides) &&
    typeof data.systemPrompt === 'string' &&
    typeof data.isPaused === 'boolean' &&
    Array.isArray(data.goals) &&
    typeof data.createdAt === 'number' &&
    (data.currentSlide === undefined || typeof data.currentSlide === 'number')
  );
};

class LessonStore {
  private readonly LESSONS_KEY = 'teachery_lessons';
  private readonly ACTIVE_LESSON_KEY = 'teachery_active_lesson';
  private lessonsCache: StoredLesson[] | null = null;
  private lastServerSync = 0;
  private syncInProgress = false;

  constructor() {
    // Initialize storage if needed
    if (!this.getLocalLessons()) {
      localStorage.setItem(this.LESSONS_KEY, JSON.stringify([]));
    }
    
    // Synchronize with server on init
    this.syncWithServer();
    
    // Clear any stale active lesson
    if (!this.getActiveLessonId() && this.getLocalLessons().length > 0) {
      this.setActiveLessonId(this.getLocalLessons()[0].id);
    }
  }

  private getActiveLessonId(): string | null {
    return localStorage.getItem(this.ACTIVE_LESSON_KEY);
  }

  private setActiveLessonId(id: string | null) {
    if (id) {
      localStorage.setItem(this.ACTIVE_LESSON_KEY, id);
    } else {
      localStorage.removeItem(this.ACTIVE_LESSON_KEY);
    }
  }

  getActiveLesson(): StoredLesson | null {
    const id = this.getActiveLessonId();
    if (!id) return null;
    return this.getLessonById(id);
  }

  setActiveLesson(id: string | null) {
    this.setActiveLessonId(id);
  }

  private getLocalLessons(): StoredLesson[] {
    try {
      const stored = localStorage.getItem(this.LESSONS_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isStoredLesson);
    } catch (error) {
      console.error('Error loading lessons from localStorage:', error);
      return [];
    }
  }

  private saveLessonsToStorage(lessons: StoredLesson[]) {
    localStorage.setItem(this.LESSONS_KEY, JSON.stringify(lessons));
    this.lessonsCache = lessons;
  }

  // New method to synchronize with server
  async syncWithServer(): Promise<void> {
    if (this.syncInProgress) return;
    
    const now = Date.now();
    // Only sync if more than 5 seconds have passed since last sync
    if (now - this.lastServerSync < 5000) return;
    
    this.syncInProgress = true;
    this.lastServerSync = now;
    
    try {
      // Get lessons from server
      const response = await api.get('/lessons');
      if (response.data && Array.isArray(response.data.lessons)) {
        const serverLessons = response.data.lessons.filter(isStoredLesson);
        const localLessons = this.getLocalLessons();
        
        // Create a map of lessons by ID
        const lessonMap = new Map<string, StoredLesson>();
        
        // Add local lessons to map
        localLessons.forEach(lesson => {
          lessonMap.set(lesson.id, lesson);
        });
        
        // Merge with server lessons, preferring newer versions
        serverLessons.forEach(serverLesson => {
          const localLesson = lessonMap.get(serverLesson.id);
          
          // If server lesson is newer or doesn't exist locally, use server version
          if (!localLesson || (serverLesson.createdAt > localLesson.createdAt)) {
            lessonMap.set(serverLesson.id, serverLesson);
          }
        });
        
        // Convert map back to array and save
        const mergedLessons = Array.from(lessonMap.values());
        this.saveLessonsToStorage(mergedLessons);
      }
    } catch (error) {
      console.error('Error syncing lessons with server:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async saveLesson(lesson: StoredLesson): Promise<void> {
    // Add createdAt if not present
    if (!lesson.createdAt) {
      lesson.createdAt = Date.now();
    }
    
    // Update current slide from localStorage if missing
    const savedSlide = localStorage.getItem(`teachery_lesson_${lesson.id}_slide`);
    if (savedSlide && !lesson.currentSlide) {
      lesson.currentSlide = parseInt(savedSlide, 10);
    }
    
    // Save locally first
    const localLessons = this.getLocalLessons();
    const existingIndex = localLessons.findIndex(l => l.id === lesson.id);
    
    if (existingIndex >= 0) {
      localLessons[existingIndex] = lesson;
    } else {
      localLessons.push(lesson);
    }
    
    this.saveLessonsToStorage(localLessons);
    
    // If this is the only lesson, make it active
    if (localLessons.length === 1 || !this.getActiveLessonId()) {
      this.setActiveLessonId(lesson.id);
    }
    
    // Also save to server
    try {
      await api.post('/lessons/save', { lesson });
    } catch (error) {
      console.error('Error saving lesson to server:', error);
    }
  }

  async getLessonByAccessCode(accessCode: string): Promise<StoredLesson | null> {
    // Try to find in local cache first
    const localLessons = this.getLocalLessons();
    let lesson = localLessons.find(lesson => lesson.accessCode.toUpperCase() === accessCode.toUpperCase());
    
    // If not found locally, try server
    if (!lesson) {
      try {
        const response = await api.get(`/lessons/code/${accessCode}`);
        if (response.data && response.data.lesson) {
          lesson = response.data.lesson;
          
          // Save to local storage for future use
          await this.saveLesson(lesson);
        }
      } catch (error) {
        console.error('Error fetching lesson by access code from server:', error);
      }
    }
    
    if (lesson) {
      // Check for current slide in localStorage
      const savedSlide = localStorage.getItem(`teachery_lesson_${lesson.id}_slide`);
      if (savedSlide) {
        lesson.currentSlide = parseInt(savedSlide, 10);
      }
    }
    
    return lesson;
  }

  async getLessonById(id: string): Promise<StoredLesson | null> {
    // Try to find in local cache first
    const localLessons = this.getLocalLessons();
    let lesson = localLessons.find(lesson => lesson.id === id);
    
    // If not found locally, try server
    if (!lesson) {
      try {
        const response = await api.get(`/lessons/${id}`);
        if (response.data && response.data.lesson) {
          lesson = response.data.lesson;
          
          // Save to local storage for future use
          const lessons = this.getLocalLessons();
          lessons.push(lesson);
          this.saveLessonsToStorage(lessons);
        }
      } catch (error) {
        console.error('Error fetching lesson by ID from server:', error);
      }
    }
    
    if (lesson) {
      // Check for current slide in localStorage
      const savedSlide = localStorage.getItem(`teachery_lesson_${lesson.id}_slide`);
      if (savedSlide) {
        lesson.currentSlide = parseInt(savedSlide, 10);
      }
    }
    
    return lesson;
  }

  async deleteLesson(id: string): Promise<void> {
    // Delete locally
    const lessons = this.getLocalLessons();
    const filtered = lessons.filter(lesson => lesson.id !== id);
    this.saveLessonsToStorage(filtered);
    
    // Clean up slide tracking
    localStorage.removeItem(`teachery_lesson_${id}_slide`);
    
    // If we deleted the active lesson, select a new one
    if (this.getActiveLessonId() === id) {
      this.setActiveLessonId(filtered.length > 0 ? filtered[0].id : null);
    }
    
    // Also delete from server
    try {
      await api.delete(`/lessons/${id}`);
    } catch (error) {
      console.error('Error deleting lesson from server:', error);
    }
  }

  async getAllLessons(): Promise<StoredLesson[]> {
    // Sync with server first
    await this.syncWithServer();
    
    const lessons = this.getLocalLessons();
    
    // Attach current slide info to each lesson
    return lessons.map(lesson => {
      const savedSlide = localStorage.getItem(`teachery_lesson_${lesson.id}_slide`);
      if (savedSlide) {
        return { ...lesson, currentSlide: parseInt(savedSlide, 10) };
      }
      return lesson;
    });
  }
}

export const lessonStore = new LessonStore();
