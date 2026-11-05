-- ============================================================
-- SVIT Portal — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  roll_number TEXT NOT NULL,
  hall_ticket TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'Regular'
    CHECK (entry_type IN ('Regular', 'LE1', 'LE2', 'LE3', 'LE4', 'LE5', 'LE6')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_hall_ticket ON students(hall_ticket);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- ============================================================
-- SUBJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Theory' CHECK (type IN ('Theory', 'Lab')),
  faculty_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TIMETABLE SLOTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS timetable_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week TEXT NOT NULL
    CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  period_number INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (day_of_week, period_number)
);

-- ============================================================
-- EXAM TIMETABLE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  venue TEXT,
  exam_type TEXT NOT NULL DEFAULT 'MidTerm' CHECK (exam_type IN ('MidTerm', 'Final')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ATTENDANCE SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_number INTEGER NOT NULL,
  conducted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (subject_id, session_date, period_number)
);

-- ============================================================
-- ATTENDANCE RECORDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Absent' CHECK (status IN ('Present', 'Absent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);

-- ============================================================
-- ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  attachment_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);

-- ============================================================
-- NOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RESULTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL
    CHECK (exam_type IN ('Mid1', 'Mid2', 'Assignment', 'Objective', 'Descriptive')),
  marks_obtained NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_marks NUMERIC(5,2) NOT NULL DEFAULT 30,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, subject_id, exam_type)
);

CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_subject ON results(subject_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Urgent')),
  attachment_url TEXT,
  posted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER ROLES TABLE (for Supabase Auth user role mapping)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'cr', 'faculty')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Attendance summary per student per subject
CREATE OR REPLACE VIEW attendance_summary AS
SELECT
  ar.student_id,
  s.id AS subject_id,
  s.name AS subject_name,
  s.code AS subject_code,
  COUNT(ar.id) AS sessions_attended,
  COUNT(DISTINCT ar.session_id) FILTER (WHERE True) AS total_sessions,
  ROUND(
    COUNT(ar.id) FILTER (WHERE ar.status = 'Present')::NUMERIC /
    NULLIF(COUNT(ar.id), 0) * 100, 1
  ) AS attendance_percentage,
  COUNT(ar.id) FILTER (WHERE ar.status = 'Present') AS attended,
  COUNT(ar.id) FILTER (WHERE ar.status = 'Absent') AS absent
FROM attendance_records ar
JOIN attendance_sessions ats ON ar.session_id = ats.id
JOIN subjects s ON ats.subject_id = s.id
GROUP BY ar.student_id, s.id, s.name, s.code;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function: is current user admin (cr or faculty)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('cr', 'faculty')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- STUDENTS: Students see only own record; admins see all
CREATE POLICY "students_select_own" ON students
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "students_insert_admin" ON students
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "students_update_admin" ON students
  FOR UPDATE USING (is_admin());

CREATE POLICY "students_delete_admin" ON students
  FOR DELETE USING (is_admin());

-- Allow linking user_id during onboarding (student can update their own unlinked record)
CREATE POLICY "students_update_own_linking" ON students
  FOR UPDATE USING (user_id IS NULL AND auth.uid() IS NOT NULL)
  WITH CHECK (user_id = auth.uid());

-- SUBJECTS: All authenticated users can read; only admins can write
CREATE POLICY "subjects_select_all" ON subjects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "subjects_write_admin" ON subjects
  FOR ALL USING (is_admin());

-- TIMETABLE SLOTS: All authenticated can read; admins write
CREATE POLICY "timetable_select_all" ON timetable_slots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "timetable_write_admin" ON timetable_slots
  FOR ALL USING (is_admin());

-- EXAM TIMETABLE: All authenticated can read; admins write
CREATE POLICY "exam_timetable_select_all" ON exam_timetable
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "exam_timetable_write_admin" ON exam_timetable
  FOR ALL USING (is_admin());

-- ATTENDANCE SESSIONS: All authenticated can read; admins write
CREATE POLICY "attendance_sessions_select" ON attendance_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "attendance_sessions_write_admin" ON attendance_sessions
  FOR ALL USING (is_admin());

-- ATTENDANCE RECORDS: Students see own records; admins see all
CREATE POLICY "attendance_records_select" ON attendance_records
  FOR SELECT USING (
    is_admin() OR
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "attendance_records_write_admin" ON attendance_records
  FOR ALL USING (is_admin());

-- ASSIGNMENTS: All authenticated read active; admins write
CREATE POLICY "assignments_select" ON assignments
  FOR SELECT USING (auth.uid() IS NOT NULL AND NOT is_archived);

CREATE POLICY "assignments_select_archived_admin" ON assignments
  FOR SELECT USING (is_admin());

CREATE POLICY "assignments_write_admin" ON assignments
  FOR ALL USING (is_admin());

-- SUBMISSIONS: Students see all submissions for class ledger (read-only); admins manage
CREATE POLICY "submissions_select_authenticated" ON submissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "submissions_write_admin" ON submissions
  FOR ALL USING (is_admin());

-- NOTES: All authenticated can read; admins write
CREATE POLICY "notes_select_all" ON notes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "notes_write_admin" ON notes
  FOR ALL USING (is_admin());

-- RESULTS: Students see own published results; admins see all
CREATE POLICY "results_select_student" ON results
  FOR SELECT USING (
    is_admin() OR
    (is_published AND student_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
  );

CREATE POLICY "results_write_admin" ON results
  FOR ALL USING (is_admin());

-- NOTIFICATIONS: All authenticated read; admins write
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "notifications_write_admin" ON notifications
  FOR ALL USING (is_admin());

-- USER ROLES: Admins manage; anyone can read own role
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "user_roles_write_admin" ON user_roles
  FOR ALL USING (is_admin());

-- ============================================================
-- SEED DATA — Class Roster (SR25 CSE Cyber Security)
-- ============================================================
INSERT INTO students (roll_number, hall_ticket, full_name, entry_type) VALUES
  ('01', '25P71A6201', 'ADEPU ABHISHEK', 'Regular'),
  ('02', '25P71A6202', 'AILENI HAMSINI', 'Regular'),
  ('03', '25P71A6203', 'ANDHYALA SRIPOOJA', 'Regular'),
  ('04', '25P71A6204', 'BIRADDAR SRIDHAR', 'Regular'),
  ('05', '25P71A6205', 'BODDUPALLI JAI CHARAN TEJA', 'Regular'),
  ('06', '25P71A6206', 'BONDHI KEDARNATH', 'Regular'),
  ('07', '25P71A6207', 'CHOWDABOINA HARSHAVARDHAN', 'Regular'),
  ('08', '25P71A6208', 'GADDALA ANUSHRUTH TEJA', 'Regular'),
  ('09', '25P71A6209', 'GADDAM DEEPTHI', 'Regular'),
  ('10', '25P71A6210', 'GELLABOINA PRANATHI YADAV', 'Regular'),
  ('11', '25P71A6211', 'GINKA RACHANA', 'Regular'),
  ('12', '25P71A6212', 'JUVVADI SRI VARSHA', 'Regular'),
  ('13', '25P71A6213', 'KANDURI HARIKA', 'Regular'),
  ('14', '25P71A6214', 'KATIPALLY HARSHA VARDHAN REDDY', 'Regular'),
  ('15', '25P71A6215', 'KURAKULA PAVAN KALYAN', 'Regular'),
  ('16', '25P71A6216', 'MAILABOINA SAI KRISHNA', 'Regular'),
  ('17', '25P71A6217', 'MINUKU PRANAV', 'Regular'),
  ('20', '25P71A6220', 'MOHAMMED ABDUL HANNAN', 'Regular'),
  ('21', '25P71A6221', 'MOTAM RAKESH', 'Regular'),
  ('22', '25P71A6222', 'NEELAM ABHIVARSHITH', 'Regular'),
  ('23', '25P71A6223', 'PALLA JASWANTH', 'Regular'),
  ('24', '25P71A6224', 'PALLAPU BHAVYA SREE', 'Regular'),
  ('25', '25P71A6225', 'PANUGOTHU SUJITH', 'Regular'),
  ('26', '25P71A6226', 'PAPPALA NAVYA', 'Regular'),
  ('27', '25P71A6227', 'PERURU KUSUMA', 'Regular'),
  ('28', '25P71A6228', 'RAMASAHAYAM VAISHNAVI', 'Regular'),
  ('29', '25P71A6229', 'RESU RASHMITHA', 'Regular'),
  ('30', '25P71A6230', 'SABHAVAT SUNIL', 'Regular'),
  ('31', '25P71A6231', 'SANCHITA MONDAL', 'Regular'),
  ('32', '25P71A6232', 'SANGEM AKSHAYKARTHIK', 'Regular'),
  ('33', '25P71A6233', 'SANGISHETTY SHIVA', 'Regular'),
  ('34', '25P71A6234', 'MIDDINTI STEVEN', 'Regular'),
  ('35', '25P71A6235', 'SYED IYAN UR RAHMAN', 'Regular'),
  ('36', '25P71A6236', 'VANJARI ROHIT YUWARAJ', 'Regular'),
  ('37', '25P71A6237', 'VELMA AKHILESH REDDY', 'Regular'),
  ('38', '25P71A6238', 'VISHWANATH GANESH', 'Regular'),
  ('39', '25P71A6239', 'VODITHE HEMANTH KUMAR NAIK', 'Regular'),
  ('40', '25P71A6240', 'VULKUNDAKAR SAI KRISHNA', 'Regular'),
  ('41', '25P71A6241', 'YEDDU PRIYANKA', 'Regular'),
  ('43', '25P71A6243', 'PALLEBOINA ANKITHRAAJ', 'Regular'),
  ('LE1', '26P75A6201', 'BHUKYA SAGAR', 'LE1'),
  ('LE2', '26P75A6202', 'GATTIGUNDE ARAVIND', 'LE2'),
  ('LE3', '26P75A6203', 'GATTU SAHITHI', 'LE3'),
  ('LE4', '26P75A6204', 'KOUKUNTLA ROHIT KUMAR', 'LE4'),
  ('LE5', '26P75A6205', 'LOKESH KUMAR BUSHIPAGA', 'LE5'),
  ('LE6', '26P75A6206', 'PONNALA JAGADISH', 'LE6')
ON CONFLICT (hall_ticket) DO NOTHING;

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase Dashboard > Storage)
-- Or use Supabase CLI:
-- supabase storage create notes-files
-- supabase storage create assignment-attachments
-- ============================================================

-- Storage bucket policies (SQL representation — configure in Dashboard):
-- notes-files: public read, authenticated write
-- assignment-attachments: public read, authenticated write

