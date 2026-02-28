'use client';

import { useState } from 'react';
import { Play, CheckCircle, Lock, Clock, FileText } from 'lucide-react';

interface CourseViewerProps {
  course: {
    _id: string;
    title: string;
    description?: string;
    coverImageUrl?: string;
    curriculum?: Array<{
      _id: string;
      title: string;
      lessons: Array<{
        _id: string;
        title: string;
        duration?: number;
        type: 'video' | 'text' | 'quiz';
        isPreview?: boolean;
      }>;
    }>;
  };
}

export default function CourseViewer({ course }: CourseViewerProps) {
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  const toggleProgress = (lessonId: string) => {
    setProgress(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }));
  };

  const totalLessons = course.curriculum?.reduce(
    (acc, section) => acc + section.lessons.length,
    0
  ) || 0;

  const completedLessons = Object.values(progress).filter(Boolean).length;
  const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
          {course.description && (
            <p className="text-zinc-400 max-w-2xl">{course.description}</p>
          )}
          
          {/* Progress Bar */}
          <div className="mt-6 max-w-md">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Course Progress</span>
              <span className="text-indigo-400">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-zinc-500 mt-2">
              {completedLessons} of {totalLessons} lessons completed
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player / Content Area */}
          <div className="lg:col-span-2">
            <div className="aspect-video bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5">
              {activeLesson ? (
                <div className="text-center">
                  <Play size={64} className="mx-auto mb-4 text-indigo-400" />
                  <p className="text-zinc-400">Lesson content would play here</p>
                </div>
              ) : (
                <div className="text-center">
                  {course.coverImageUrl ? (
                    <img
                      src={course.coverImageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <>
                      <Play size={64} className="mx-auto mb-4 text-zinc-600" />
                      <p className="text-zinc-500">Select a lesson to start learning</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Curriculum Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Course Content</h2>
              
              {course.curriculum?.map((section, sectionIndex) => (
                <div key={section._id} className="mb-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">
                    Section {sectionIndex + 1}: {section.title}
                  </h3>
                  <div className="space-y-2">
                    {section.lessons.map((lesson, lessonIndex) => (
                      <button
                        key={lesson._id}
                        onClick={() => setActiveLesson(lesson._id)}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          activeLesson === lesson._id
                            ? 'bg-indigo-500/10 border border-indigo-500/30'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProgress(lesson._id);
                            }}
                            className="mt-0.5"
                          >
                            {progress[lesson._id] ? (
                              <CheckCircle size={18} className="text-emerald-400" />
                            ) : (
                              <div className="w-[18px] h-[18px] rounded-full border-2 border-zinc-600" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {lessonIndex + 1}. {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {lesson.type === 'video' && (
                                <Play size={12} className="text-zinc-500" />
                              )}
                              {lesson.type === 'text' && (
                                <FileText size={12} className="text-zinc-500" />
                              )}
                              {lesson.duration && (
                                <span className="text-xs text-zinc-500 flex items-center gap-1">
                                  <Clock size={10} />
                                  {lesson.duration} min
                                </span>
                              )}
                              {lesson.isPreview && (
                                <span className="text-xs text-emerald-400">Preview</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {(!course.curriculum || course.curriculum.length === 0) && (
                <p className="text-zinc-500 text-center py-8">
                  No curriculum available yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
