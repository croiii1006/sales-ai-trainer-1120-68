-- 用户角色枚举
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- 用户角色表
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 用户资料表
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    team_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 团队/门店表
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 添加外键约束
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- 课程章节表
CREATE TABLE public.course_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT '概述',
    order_index INTEGER NOT NULL DEFAULT 0,
    is_theory BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_chapters ENABLE ROW LEVEL SECURITY;

-- 课程视频表
CREATE TABLE public.course_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES public.course_chapters(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    duration_seconds INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;

-- 测试题表
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES public.course_chapters(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    correct_answer INTEGER NOT NULL,
    explanation TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- 学习进度表
CREATE TABLE public.learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    chapter_id UUID REFERENCES public.course_chapters(id) ON DELETE CASCADE NOT NULL,
    video_completed BOOLEAN NOT NULL DEFAULT false,
    quiz_score INTEGER,
    quiz_completed_at TIMESTAMP WITH TIME ZONE,
    simulation_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, chapter_id)
);

ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

-- 实战模拟记录表
CREATE TABLE public.simulation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    chapter_id UUID REFERENCES public.course_chapters(id) ON DELETE SET NULL,
    brand TEXT NOT NULL,
    persona TEXT NOT NULL,
    scenario TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]',
    overall_score INTEGER,
    dimension_scores JSONB,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.simulation_sessions ENABLE ROW LEVEL SECURITY;

-- 培训文件表
CREATE TABLE public.training_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_materials ENABLE ROW LEVEL SECURITY;

-- 创建视频存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('training-videos', 'training-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('training-materials', 'training-materials', true);

-- 角色检查函数 (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- 获取用户角色函数
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS 策略

-- user_roles: 用户只能读取自己的角色，管理员可以读取所有
CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles" ON public.user_roles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- profiles: 用户可读写自己的资料，管理员可读取所有
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- teams: 所有登录用户可读取
CREATE POLICY "Authenticated users can read teams" ON public.teams
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage teams" ON public.teams
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- course_chapters: 所有登录用户可读取
CREATE POLICY "Authenticated users can read chapters" ON public.course_chapters
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage chapters" ON public.course_chapters
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- course_videos: 所有登录用户可读取
CREATE POLICY "Authenticated users can read videos" ON public.course_videos
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage videos" ON public.course_videos
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- quiz_questions: 所有登录用户可读取
CREATE POLICY "Authenticated users can read questions" ON public.quiz_questions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage questions" ON public.quiz_questions
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- learning_progress: 用户可读写自己的进度
CREATE POLICY "Users can manage own progress" ON public.learning_progress
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all progress" ON public.learning_progress
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- simulation_sessions: 用户可读写自己的记录
CREATE POLICY "Users can manage own sessions" ON public.simulation_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all sessions" ON public.simulation_sessions
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- training_materials: 所有登录用户可读取
CREATE POLICY "Authenticated users can read materials" ON public.training_materials
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage materials" ON public.training_materials
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies
CREATE POLICY "Public read access for training videos" ON storage.objects
    FOR SELECT USING (bucket_id = 'training-videos');

CREATE POLICY "Admins can upload training videos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'training-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete training videos" ON storage.objects
    FOR DELETE USING (bucket_id = 'training-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read access for training materials" ON storage.objects
    FOR SELECT USING (bucket_id = 'training-materials');

CREATE POLICY "Admins can upload training materials" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'training-materials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete training materials" ON storage.objects
    FOR DELETE USING (bucket_id = 'training-materials' AND public.has_role(auth.uid(), 'admin'));

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_chapters_updated_at
    BEFORE UPDATE ON public.course_chapters
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at
    BEFORE UPDATE ON public.learning_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 注册时自动创建 profile 和默认角色的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();