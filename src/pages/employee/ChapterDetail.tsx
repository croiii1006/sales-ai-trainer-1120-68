import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  BookOpen,
  HelpCircle,
  Swords
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  category: string;
  is_theory: boolean;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_seconds: number | null;
  order_index: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  order_index: number;
}

interface LearningProgress {
  video_completed: boolean;
  quiz_score: number | null;
  simulation_completed: boolean;
}

type TabType = "video" | "quiz" | "simulation";

const ChapterDetail = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<TabType>("video");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoWatched, setVideoWatched] = useState(false);
  
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!chapterId || !user) return;

      const [chapterRes, videosRes, questionsRes, progressRes] = await Promise.all([
        supabase.from("course_chapters").select("*").eq("id", chapterId).single(),
        supabase.from("course_videos").select("*").eq("chapter_id", chapterId).order("order_index"),
        supabase.from("quiz_questions").select("*").eq("chapter_id", chapterId).order("order_index"),
        supabase.from("learning_progress").select("*").eq("user_id", user.id).eq("chapter_id", chapterId).single(),
      ]);

      if (chapterRes.data) setChapter(chapterRes.data);
      if (videosRes.data) setVideos(videosRes.data);
      if (questionsRes.data) {
        setQuestions(questionsRes.data.map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options as string[] : []
        })));
      }
      if (progressRes.data) {
        setProgress(progressRes.data);
        if (progressRes.data.quiz_score !== null) {
          setQuizSubmitted(true);
          setQuizScore(progressRes.data.quiz_score);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [chapterId, user]);

  const handleVideoEnded = async () => {
    setVideoWatched(true);
    
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      // All videos watched, update progress
      if (user && chapterId) {
        await supabase.from("learning_progress").upsert({
          user_id: user.id,
          chapter_id: chapterId,
          video_completed: true,
        }, { onConflict: "user_id,chapter_id" });

        toast({
          title: "视频学习完成",
          description: "可以继续进行测试了",
        });
      }
    }
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(quizAnswers).length < questions.length) {
      toast({
        title: "请完成所有题目",
        description: `您还有 ${questions.length - Object.keys(quizAnswers).length} 道题未作答`,
        variant: "destructive",
      });
      return;
    }

    let correct = 0;
    questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correct_answer) {
        correct++;
      }
    });

    const score = Math.round((correct / questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    if (user && chapterId) {
      const isCompleted = score >= 60 && (chapter?.is_theory || progress?.simulation_completed);
      
      await supabase.from("learning_progress").upsert({
        user_id: user.id,
        chapter_id: chapterId,
        quiz_score: score,
        quiz_completed_at: new Date().toISOString(),
        completed_at: isCompleted ? new Date().toISOString() : null,
      }, { onConflict: "user_id,chapter_id" });

      toast({
        title: score >= 60 ? "测试通过！" : "测试未通过",
        description: score >= 60 
          ? `恭喜！您获得了 ${score} 分` 
          : `您获得了 ${score} 分，请继续学习后重试`,
        variant: score >= 60 ? "default" : "destructive",
      });
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleStartSimulation = () => {
    navigate(`/simulation?chapter=${chapterId}`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="p-6 text-center">
        <p>章节不存在</p>
        <Button variant="link" onClick={() => navigate("/courses")}>
          返回课程列表
        </Button>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/courses")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{chapter.title}</h1>
          <p className="text-muted-foreground">{chapter.description}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          variant={activeTab === "video" ? "default" : "ghost"}
          onClick={() => setActiveTab("video")}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          视频学习
          {progress?.video_completed && <CheckCircle className="h-4 w-4 text-green-500" />}
        </Button>
        <Button
          variant={activeTab === "quiz" ? "default" : "ghost"}
          onClick={() => setActiveTab("quiz")}
          className="gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          章节测试
          {progress?.quiz_score !== null && progress.quiz_score >= 60 && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </Button>
        {!chapter.is_theory && (
          <Button
            variant={activeTab === "simulation" ? "default" : "ghost"}
            onClick={() => setActiveTab("simulation")}
            className="gap-2"
          >
            <Swords className="h-4 w-4" />
            实战模拟
            {progress?.simulation_completed && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Button>
        )}
      </div>

      {/* Video Tab */}
      {activeTab === "video" && (
        <div className="space-y-4">
          {videos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无视频内容</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Video Player */}
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    {currentVideo ? (
                      <video
                        ref={videoRef}
                        src={currentVideo.video_url}
                        controls
                        className="w-full h-full"
                        onEnded={handleVideoEnded}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        视频加载中...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Video List */}
              {videos.length > 1 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">视频列表</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {videos.map((video, index) => (
                        <button
                          key={video.id}
                          onClick={() => setCurrentVideoIndex(index)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            index === currentVideoIndex
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{video.title}</p>
                            {video.duration_seconds && (
                              <p className="text-sm text-muted-foreground">
                                {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                              </p>
                            )}
                          </div>
                          {index === currentVideoIndex && (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Continue Button */}
              {progress?.video_completed && (
                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab("quiz")} className="gap-2">
                    继续测试
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Quiz Tab */}
      {activeTab === "quiz" && (
        <div className="space-y-6">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无测试题目</p>
              </CardContent>
            </Card>
          ) : quizSubmitted ? (
            /* Quiz Results */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {quizScore !== null && quizScore >= 60 ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  测试结果
                </CardTitle>
                <CardDescription>
                  {quizScore !== null && quizScore >= 60 
                    ? "恭喜你通过了测试！" 
                    : "很遗憾，请继续学习后重试"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6">
                  <div className="text-5xl font-bold mb-2">
                    {quizScore}
                    <span className="text-2xl text-muted-foreground">分</span>
                  </div>
                  <p className="text-muted-foreground">
                    正确率 {quizScore}%，及格线 60%
                  </p>
                </div>

                {/* Show answers */}
                <div className="space-y-4">
                  {questions.map((q, index) => {
                    const userAnswer = quizAnswers[q.id];
                    const isCorrect = userAnswer === q.correct_answer;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-lg border ${
                          isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium">
                              {index + 1}. {q.question}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              您的答案: {q.options[userAnswer]} 
                              {!isCorrect && ` | 正确答案: ${q.options[q.correct_answer]}`}
                            </p>
                            {q.explanation && (
                              <p className="text-sm text-muted-foreground mt-1">
                                解析: {q.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2">
                  {quizScore !== null && quizScore < 60 && (
                    <Button variant="outline" onClick={handleRetakeQuiz}>
                      重新测试
                    </Button>
                  )}
                  {!chapter.is_theory && quizScore !== null && quizScore >= 60 && (
                    <Button onClick={() => setActiveTab("simulation")} className="gap-2">
                      进入实战模拟
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Quiz Questions */
            <>
              <Card>
                <CardHeader>
                  <CardTitle>章节测试</CardTitle>
                  <CardDescription>
                    共 {questions.length} 道题，及格线 60 分
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {questions.map((q, index) => (
                    <div key={q.id} className="space-y-3">
                      <p className="font-medium">
                        {index + 1}. {q.question}
                      </p>
                      <RadioGroup
                        value={quizAnswers[q.id]?.toString()}
                        onValueChange={(value) =>
                          setQuizAnswers({ ...quizAnswers, [q.id]: parseInt(value) })
                        }
                      >
                        {q.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={optIndex.toString()} id={`${q.id}-${optIndex}`} />
                            <Label htmlFor={`${q.id}-${optIndex}`} className="cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  已完成 {Object.keys(quizAnswers).length} / {questions.length} 题
                </p>
                <Button onClick={handleSubmitQuiz}>
                  提交答案
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Simulation Tab */}
      {activeTab === "simulation" && !chapter.is_theory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5" />
              实战模拟
            </CardTitle>
            <CardDescription>
              通过与 AI 顾客的对话练习，提升您的销售技能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress?.simulation_completed ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span>您已完成本章节的实战模拟</span>
              </div>
            ) : (
              <p className="text-muted-foreground">
                点击下方按钮开始实战模拟，完成后将记录您的表现并计入学习进度。
              </p>
            )}
            <Button onClick={handleStartSimulation} className="gap-2">
              {progress?.simulation_completed ? "再次练习" : "开始模拟"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChapterDetail;
