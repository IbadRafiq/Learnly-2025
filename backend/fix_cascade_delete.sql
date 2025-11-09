-- Migration to add CASCADE DELETE to foreign keys
-- Run this SQL script on your PostgreSQL database

-- Fix user_analytics foreign key
ALTER TABLE user_analytics 
DROP CONSTRAINT IF EXISTS user_analytics_user_id_fkey;

ALTER TABLE user_analytics 
ADD CONSTRAINT user_analytics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Fix course_analytics foreign key
ALTER TABLE course_analytics 
DROP CONSTRAINT IF EXISTS course_analytics_course_id_fkey;

ALTER TABLE course_analytics 
ADD CONSTRAINT course_analytics_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Fix course_enrollments foreign keys
ALTER TABLE course_enrollments 
DROP CONSTRAINT IF EXISTS course_enrollments_student_id_fkey;

ALTER TABLE course_enrollments 
ADD CONSTRAINT course_enrollments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE course_enrollments 
DROP CONSTRAINT IF EXISTS course_enrollments_course_id_fkey;

ALTER TABLE course_enrollments 
ADD CONSTRAINT course_enrollments_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Fix quiz_attempts foreign key
ALTER TABLE quiz_attempts 
DROP CONSTRAINT IF EXISTS quiz_attempts_student_id_fkey;

ALTER TABLE quiz_attempts 
ADD CONSTRAINT quiz_attempts_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

-- Fix assignment_submissions foreign key  
ALTER TABLE assignment_submissions 
DROP CONSTRAINT IF EXISTS assignment_submissions_student_id_fkey;

ALTER TABLE assignment_submissions 
ADD CONSTRAINT assignment_submissions_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

-- Fix course materials foreign key
ALTER TABLE course_materials 
DROP CONSTRAINT IF EXISTS course_materials_course_id_fkey;

ALTER TABLE course_materials 
ADD CONSTRAINT course_materials_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Fix quizzes foreign key
ALTER TABLE quizzes 
DROP CONSTRAINT IF EXISTS quizzes_course_id_fkey;

ALTER TABLE quizzes 
ADD CONSTRAINT quizzes_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Fix assignments foreign key
ALTER TABLE assignments 
DROP CONSTRAINT IF EXISTS assignments_course_id_fkey;

ALTER TABLE assignments 
ADD CONSTRAINT assignments_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Fix quiz_questions foreign key
ALTER TABLE quiz_questions 
DROP CONSTRAINT IF EXISTS quiz_questions_quiz_id_fkey;

ALTER TABLE quiz_questions 
ADD CONSTRAINT quiz_questions_quiz_id_fkey 
FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;

-- Fix quiz_answers foreign keys
ALTER TABLE quiz_answers 
DROP CONSTRAINT IF EXISTS quiz_answers_attempt_id_fkey;

ALTER TABLE quiz_answers 
ADD CONSTRAINT quiz_answers_attempt_id_fkey 
FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE;

ALTER TABLE quiz_answers 
DROP CONSTRAINT IF EXISTS quiz_answers_question_id_fkey;

ALTER TABLE quiz_answers 
ADD CONSTRAINT quiz_answers_question_id_fkey 
FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE;

-- Fix assignment_submissions foreign keys
ALTER TABLE assignment_submissions 
DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_fkey;

ALTER TABLE assignment_submissions 
ADD CONSTRAINT assignment_submissions_assignment_id_fkey 
FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE;
