"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Database Course interface to match the actual schema
interface Course {
  id: string;
  title: string;
  language: string;
  level: string;
  certification_type: string;
  description: string;
  components: string[];
}

interface CourseSelectionProps {
  initialCourses?: Course[];
  onCourseSelect?: (course: Course) => void;
}

function CourseSelection({
  initialCourses = [],
  onCourseSelect,
}: CourseSelectionProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [filteredCourses, setFilteredCourses] =
    useState<Course[]>(initialCourses);
  const router = useRouter();

  // Fetch courses on component mount only if no initial courses provided
  useEffect(() => {
    if (initialCourses.length > 0) {
      setCourses(initialCourses);
      setFilteredCourses(initialCourses);
      setLoading(false);
      return;
    }

    const fetchCourses = async () => {
      try {
        setLoading(true);
        
        // Use direct Supabase client instead of API call since we need auth
        const { createSupabaseClient } = await import("../../utils/supabase/client");
        const supabase = createSupabaseClient();
        
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // If not authenticated, try to fetch public courses first
          try {
            const response = await fetch("/api/academia/courses/public");
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                setCourses(result.data);
                setFilteredCourses(result.data);
                return;
              }
            }
          } catch (publicError) {
            console.log("Public endpoint failed, trying authenticated endpoint:", publicError);
          }

          // Fallback to authenticated endpoint
          const response = await fetch("/api/academia/courses");
          if (!response.ok) {
            // Don't redirect - just log error and use fallback data
            console.error("Failed to fetch courses from API, using fallback data");
            setCourses([]);
            setFilteredCourses([]);
            return;
          }
          const result = await response.json();
          setCourses(result.data || []);
          setFilteredCourses(result.data || []);
          return;
        }

        // If authenticated, get courses with full details
        const { data: courses, error } = await supabase
          .from('courses')
          .select(`
            id, title, language, level, certification_type, description, components,
            certification_modules!inner(name, code)
          `)
          .eq('is_active', true)
          .order('language')
          .order('level');

        if (error) {
          console.error('Error fetching courses:', error);
          throw new Error('Failed to fetch courses');
        }

        setCourses(courses || []);
        setFilteredCourses(courses || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
        // Fallback to empty array on error
        setCourses([]);
        setFilteredCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [initialCourses.length]); // Only depend on length to avoid unnecessary re-renders

  // Filter courses by selected language
  useEffect(() => {
    if (selectedLanguage) {
      setFilteredCourses(
        courses.filter((course) => course.language === selectedLanguage)
      );
    } else {
      setFilteredCourses(courses);
    }
  }, [selectedLanguage, courses]);

  // Get unique languages for filter dropdown
  const uniqueLanguages = Array.from(
    new Set(courses.map((course) => course.language))
  );

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
  };

  const handleCourseClick = (course: Course) => {
    if (onCourseSelect) {
      onCourseSelect(course);
    } else {
      // Default navigation behavior
      router.push(
        `/dashboard/${course.language.toLowerCase()}/${course.level.toLowerCase()}`
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <h3 className="text-destructive font-medium">Error loading courses</h3>
        <p className="text-destructive/80 mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Choose Your Course
        </h1>
        <p className="text-muted-foreground">
          Select a language and certification level to begin your learning
          journey
        </p>
      </div>

      {/* Language Filter */}
      <div className="mb-8">
        <label
          htmlFor="language-filter"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Filter by Language
        </label>
        <select
          id="language-filter"
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="admin-input block w-full max-w-xs rounded-md shadow-sm sm:text-sm"
        >
          <option value="">All Languages</option>
          {uniqueLanguages.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground mb-2">
            No courses available
          </h3>
          <p className="text-muted-foreground">
            {selectedLanguage
              ? `No courses found for ${selectedLanguage}. Try selecting a different language.`
              : "No courses are currently available. Please check back later."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={`${course.language}-${course.level}`}
              onClick={() => handleCourseClick(course)}
              className="admin-card academy-card-hover rounded-xl shadow-md overflow-hidden cursor-pointer"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {course.title}
                    </h3>
                    <p className="text-muted-foreground mt-1">{course.description}</p>
                  </div>
                  <div className="bg-construction-primary/10 text-construction-primary text-xs font-semibold px-2.5 py-0.5 rounded">
                    {course.certification_type?.toUpperCase()}
                  </div>
                </div>

                <div className="mt-4 flex items-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-construction-secondary/20 text-construction-accent">
                    {course.language} {course.level}
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-foreground">
                    Exam Components
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {course.components?.map((component) => (
                      <span
                        key={component}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                      >
                        {component.replace("_", " ").charAt(0).toUpperCase() + component.replace("_", " ").slice(1)}
                      </span>
                    )) || []}
                  </div>
                </div>
              </div>

              <div className="bg-muted px-6 py-4">
                <button className="admin-button-primary w-full font-medium py-2 px-4 rounded-lg">
                  Select Course
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CourseSelection;
export { CourseSelection };
