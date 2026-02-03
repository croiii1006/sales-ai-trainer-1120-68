import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CheckCircle, Play, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  category: string;
  order_index: number;
  is_theory: boolean;
}

interface LearningProgress {
  chapter_id: string;
  video_completed: boolean;
  quiz_score: number | null;
  simulation_completed: boolean;
  completed_at: string | null;
}

const categoryColors: Record<string, string> = {
  "概述": "bg-blue-500/20 text-blue-500",
  "社交技巧": "bg-green-500/20 text-green-500",
  "产品知识": "bg-purple-500/20 text-purple-500",
  "销售技巧": "bg-orange-500/20 text-orange-500",
  "客户服务": "bg-pink-500/20 text-pink-500",
  "异议处理": "bg-yellow-500/20 text-yellow-500",
};

const Courses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<Record<string, LearningProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [chaptersRes, progressRes] = await Promise.all([
        supabase
          .from("course_chapters")
          .select("*")
          .order("order_index", { ascending: true }),
        supabase
          .from("learning_progress")
          .select("*")
          .eq("user_id", user.id),
      ]);

      if (chaptersRes.data) {
        setChapters(chaptersRes.data);
      }

      if (progressRes.data) {
        const progressMap: Record<string, LearningProgress> = {};
        progressRes.data.forEach((p) => {
          progressMap[p.chapter_id] = p;
        });
        setProgress(progressMap);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const getChapterProgress = (chapter: Chapter): number => {
    const p = progress[chapter.id];
    if (!p) return 0;

    let total = 2; // video + quiz
    let completed = 0;

    if (p.video_completed) completed++;
    if (p.quiz_score !== null) completed++;

    if (!chapter.is_theory) {
      total++;
      if (p.simulation_completed) completed++;
    }

    return Math.round((completed / total) * 100);
  };

  const getChapterStatus = (chapter: Chapter) => {
    const p = progress[chapter.id];
    if (!p) return "not_started";
    if (p.completed_at) return "completed";
    if (p.video_completed || p.quiz_score !== null) return "in_progress";
    return "not_started";
  };

  // Group chapters by category
  const groupedChapters = chapters.reduce((acc, chapter) => {
    if (!acc[chapter.category]) {
      acc[chapter.category] = [];
    }
    acc[chapter.category].push(chapter);
    return acc;
  }, {} as Record<string, Chapter[]>);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">暂无课程</h2>
        <p className="text-muted-foreground">
          管理员尚未添加任何培训课程，请稍后再来查看。
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">网课学习</h1>
        <p className="text-muted-foreground">
          完成视频学习和测试，掌握销售技能
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">总体学习进度</span>
            <span className="text-sm text-muted-foreground">
              {Object.values(progress).filter((p) => p.completed_at).length} / {chapters.length} 章节完成
            </span>
          </div>
          <Progress 
            value={
              chapters.length > 0 
                ? (Object.values(progress).filter((p) => p.completed_at).length / chapters.length) * 100
                : 0
            } 
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Chapters by Category */}
      {Object.entries(groupedChapters).map(([category, categoryChapters]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={categoryColors[category] || "bg-gray-500/20 text-gray-500"}>
              {category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {categoryChapters.length} 章节
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryChapters.map((chapter) => {
              const status = getChapterStatus(chapter);
              const progressValue = getChapterProgress(chapter);

              return (
                <Card
                  key={chapter.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors group"
                  onClick={() => navigate(`/courses/${chapter.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {chapter.title}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {chapter.description || "暂无描述"}
                        </CardDescription>
                      </div>
                      {status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      ) : status === "in_progress" ? (
                        <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
                      ) : (
                        <Play className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {chapter.is_theory ? "理论课" : "实战课"}
                        </span>
                        <span className="font-medium">{progressValue}%</span>
                      </div>
                      <Progress value={progressValue} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Courses;
