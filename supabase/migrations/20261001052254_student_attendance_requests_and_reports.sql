CREATE TABLE public.attendance_requests (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
	session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
	requested_status TEXT NOT NULL CHECK (requested_status IN ('present', 'absent', 'late')),
	reason TEXT NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 10 AND 1000),
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
	review_note TEXT CHECK (review_note IS NULL OR char_length(btrim(review_note)) <= 1000),
	reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
	reviewed_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX attendance_requests_student_created_idx
	ON public.attendance_requests (student_id, created_at DESC);
CREATE INDEX attendance_requests_status_created_idx
	ON public.attendance_requests (status, created_at DESC);

ALTER TABLE public.attendance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage attendance requests" ON public.attendance_requests
	FOR ALL TO authenticated
	USING ((SELECT get_user_role()) = 'admin')
	WITH CHECK ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Students can view own attendance requests" ON public.attendance_requests
	FOR SELECT TO authenticated
	USING (student_id = (SELECT get_user_student_id()));

CREATE POLICY "Students can create own pending attendance requests" ON public.attendance_requests
	FOR INSERT TO authenticated
	WITH CHECK (
		student_id = (SELECT get_user_student_id())
		AND status = 'pending'
		AND review_note IS NULL
		AND reviewed_by IS NULL
		AND reviewed_at IS NULL
	);

REVOKE UPDATE, DELETE ON public.attendance_requests FROM authenticated;
GRANT SELECT, INSERT ON public.attendance_requests TO authenticated;
GRANT UPDATE ON public.attendance_requests TO authenticated;

CREATE TABLE public.student_reports (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
	title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 120),
	body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 10 AND 5000),
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
	admin_response TEXT CHECK (admin_response IS NULL OR char_length(btrim(admin_response)) <= 5000),
	reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
	reviewed_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX student_reports_student_created_idx
	ON public.student_reports (student_id, created_at DESC);
CREATE INDEX student_reports_status_created_idx
	ON public.student_reports (status, created_at DESC);

ALTER TABLE public.student_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage student reports" ON public.student_reports
	FOR ALL TO authenticated
	USING ((SELECT get_user_role()) = 'admin')
	WITH CHECK ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Students can view own reports" ON public.student_reports
	FOR SELECT TO authenticated
	USING (student_id = (SELECT get_user_student_id()));

CREATE POLICY "Students can create own pending reports" ON public.student_reports
	FOR INSERT TO authenticated
	WITH CHECK (
		student_id = (SELECT get_user_student_id())
		AND status = 'pending'
		AND admin_response IS NULL
		AND reviewed_by IS NULL
		AND reviewed_at IS NULL
	);

REVOKE UPDATE, DELETE ON public.student_reports FROM authenticated;
GRANT SELECT, INSERT ON public.student_reports TO authenticated;
GRANT UPDATE ON public.student_reports TO authenticated;
