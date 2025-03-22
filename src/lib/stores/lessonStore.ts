import { Lesson, Slide, Goal } from '@/types';

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

  constructor() {
    // Initialize storage if needed
    if (!this.getLessons()) {
      localStorage.setItem(this.LESSONS_KEY, JSON.stringify([]));
    }
    
    // Clear any stale active lesson
    if (!this.getActiveLessonId() && this.getLessons().length > 0) {
      this.setActiveLessonId(this.getLessons()[0].id);
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

  private getLessons(): StoredLesson[] {
    try {
      const stored = localStorage.getItem(this.LESSONS_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(isStoredLesson);
    } catch (error) {
      console.error('Error loading lessons:', error);
      return [];
    }
  }

  private saveLessonsToStorage(lessons: StoredLesson[]) {
    localStorage.setItem(this.LESSONS_KEY, JSON.stringify(lessons));
  }

  saveLesson(lesson: StoredLesson): void {
    // Add createdAt if not present
    if (!lesson.createdAt) {
      lesson.createdAt = Date.now();
    }
    
    // Update current slide from localStorage if missing
    const savedSlide = localStorage.getItem(`teachery_lesson_${lesson.id}_slide`);
    if (savedSlide && !lesson.currentSlide) {
      lesson.currentSlide = parseInt(savedSlide, 10);
    }

    const lessons = this.getLessons();
    const existingIndex = lessons.findIndex(l => l.id === lesson.id);
    
    if (existingIndex >= 0) {
      lessons[existingIndex] = lesson;
    } else {
      lessons.push(lesson);
    }
    
    this.saveLessonsToStorage(lessons);

    // If this is the only lesson, make it active
    if (lessons.length === 1 || !this.getActiveLessonId()) {
      this.setActiveLessonId(lesson.id);
    }
  }

  getLessonByAccessCode(accessCode: string): StoredLesson | null {
    const lessons = this.getLessons();
    const lesson = lessons.find(lesson => lesson.accessCode.toUpperCase() === accessCode.toUpperCase());
    if (lesson) {
      // Check for current slide in localStorage
      const savedSlide = localStorage.getItem(`teachery_lesson_${lesson.id}_slide`);
      if (savedSlide) {
        lesson.currentSlide = parseInt(savedSlide, 10);
      }
    }
    return lesson;
  }

  getLessonById(id: string): StoredLesson | null {
    const lessons = this.getLessons();
    const lesson = lessons.find(lesson => lesson.id === id);
    if (lesson) {
      // Check for current slide in localStorage
      const savedSlide = localStorage.getItem(`teachery_lesson_${lesson.id}_slide`);
      if (savedSlide) {
        lesson.currentSlide = parseInt(savedSlide, 10);
      }
    }
    return lesson;
  }

  deleteLesson(id: string): void {
    const lessons = this.getLessons();
    const filtered = lessons.filter(lesson => lesson.id !== id);
    this.saveLessonsToStorage(filtered);

    // Clean up slide tracking
    localStorage.removeItem(`teachery_lesson_${id}_slide`);

    // If we deleted the active lesson, select a new one
    if (this.getActiveLessonId() === id) {
      this.setActiveLessonId(filtered.length > 0 ? filtered[0].id : null);
    }
  }

  getAllLessons(): StoredLesson[] {
    const lessons = this.getLessons();
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
