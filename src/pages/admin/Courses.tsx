import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Video, HelpCircle, GripVertical } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  category: string;
  order_index: number;
  is_theory: boolean;
}

interface CourseVideo {
  id: string;
  chapter_id: string;
  title: string;
  video_url: string;
  order_index: number;
}

interface QuizQuestion {
  id: string;
  chapter_id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

const categories = ["概述", "社交技巧", "产品知识", "销售技巧", "客户服务", "异议处理"];

const AdminCourses = () => {
  const { toast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [videos, setVideos] = useState<Record<string, CourseVideo[]>>({});
  const [questions, setQuestions] = useState<Record<string, QuizQuestion[]>>({});
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // Form states
  const [chapterForm, setChapterForm] = useState({
    title: "",
    description: "",
    category: "概述",
    is_theory: true,
  });
  const [videoForm, setVideoForm] = useState({
    title: "",
    video_url: "",
  });
  const [questionForm, setQuestionForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: 0,
  });

  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    const [chaptersRes, videosRes, questionsRes] = await Promise.all([
      supabase.from("course_chapters").select("*").order("order_index"),
      supabase.from("course_videos").select("*").order("order_index"),
      supabase.from("quiz_questions").select("*").order("order_index"),
    ]);

    if (chaptersRes.data) setChapters(chaptersRes.data);

    if (videosRes.data) {
      const videosByChapter: Record<string, CourseVideo[]> = {};
      videosRes.data.forEach((v) => {
        if (!videosByChapter[v.chapter_id]) videosByChapter[v.chapter_id] = [];
        videosByChapter[v.chapter_id].push(v);
      });
      setVideos(videosByChapter);
    }

    if (questionsRes.data) {
      const questionsByChapter: Record<string, QuizQuestion[]> = {};
      questionsRes.data.forEach((q) => {
        if (!questionsByChapter[q.chapter_id]) questionsByChapter[q.chapter_id] = [];
        questionsByChapter[q.chapter_id].push({
          ...q,
          options: Array.isArray(q.options) ? q.options as string[] : []
        });
      });
      setQuestions(questionsByChapter);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateChapter = async () => {
    if (!chapterForm.title.trim()) {
      toast({ title: "请输入章节标题", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("course_chapters").insert({
      title: chapterForm.title,
      description: chapterForm.description || null,
      category: chapterForm.category,
      is_theory: chapterForm.is_theory,
      order_index: chapters.length,
    });

    if (error) {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "章节创建成功" });
      setChapterDialogOpen(false);
      setChapterForm({ title: "", description: "", category: "概述", is_theory: true });
      fetchData();
    }
  };

  const handleUpdateChapter = async () => {
    if (!editingChapter) return;

    const { error } = await supabase
      .from("course_chapters")
      .update({
        title: chapterForm.title,
        description: chapterForm.description || null,
        category: chapterForm.category,
        is_theory: chapterForm.is_theory,
      })
      .eq("id", editingChapter.id);

    if (error) {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "章节更新成功" });
      setChapterDialogOpen(false);
      setEditingChapter(null);
      setChapterForm({ title: "", description: "", category: "概述", is_theory: true });
      fetchData();
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm("确定要删除这个章节吗？相关的视频和题目也会被删除。")) return;

    const { error } = await supabase.from("course_chapters").delete().eq("id", id);
    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "章节已删除" });
      fetchData();
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChapterId) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${selectedChapterId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("training-videos")
      .upload(filePath, file);

    if (error) {
      toast({ title: "上传失败", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("training-videos")
      .getPublicUrl(filePath);

    setVideoForm({ ...videoForm, video_url: publicUrl });
    setUploading(false);
    toast({ title: "视频上传成功" });
  };

  const handleCreateVideo = async () => {
    if (!videoForm.title.trim() || !videoForm.video_url || !selectedChapterId) {
      toast({ title: "请填写完整信息", variant: "destructive" });
      return;
    }

    const chapterVideos = videos[selectedChapterId] || [];

    const { error } = await supabase.from("course_videos").insert({
      chapter_id: selectedChapterId,
      title: videoForm.title,
      video_url: videoForm.video_url,
      order_index: chapterVideos.length,
    });

    if (error) {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "视频添加成功" });
      setVideoDialogOpen(false);
      setVideoForm({ title: "", video_url: "" });
      fetchData();
    }
  };

  const handleCreateQuestion = async () => {
    if (!questionForm.question.trim() || !selectedChapterId) {
      toast({ title: "请填写题目", variant: "destructive" });
      return;
    }

    const validOptions = questionForm.options.filter(o => o.trim());
    if (validOptions.length < 2) {
      toast({ title: "至少需要2个选项", variant: "destructive" });
      return;
    }

    const chapterQuestions = questions[selectedChapterId] || [];

    const { error } = await supabase.from("quiz_questions").insert({
      chapter_id: selectedChapterId,
      question: questionForm.question,
      options: validOptions,
      correct_answer: questionForm.correct_answer,
      order_index: chapterQuestions.length,
    });

    if (error) {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "题目添加成功" });
      setQuestionDialogOpen(false);
      setQuestionForm({ question: "", options: ["", "", "", ""], correct_answer: 0 });
      fetchData();
    }
  };

  const openEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterForm({
      title: chapter.title,
      description: chapter.description || "",
      category: chapter.category,
      is_theory: chapter.is_theory,
    });
    setChapterDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">课程管理</h1>
          <p className="text-muted-foreground">管理培训课程章节、视频和测试题</p>
        </div>
        <Dialog open={chapterDialogOpen} onOpenChange={(open) => {
          setChapterDialogOpen(open);
          if (!open) {
            setEditingChapter(null);
            setChapterForm({ title: "", description: "", category: "概述", is_theory: true });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              添加章节
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChapter ? "编辑章节" : "添加新章节"}</DialogTitle>
              <DialogDescription>填写章节信息</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>标题</Label>
                <Input
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  placeholder="章节标题"
                />
              </div>
              <div>
                <Label>描述</Label>
                <Textarea
                  value={chapterForm.description}
                  onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                  placeholder="章节描述（可选）"
                />
              </div>
              <div>
                <Label>分类</Label>
                <Select
                  value={chapterForm.category}
                  onValueChange={(value) => setChapterForm({ ...chapterForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>理论课程（无实战模拟）</Label>
                <Switch
                  checked={chapterForm.is_theory}
                  onCheckedChange={(checked) => setChapterForm({ ...chapterForm, is_theory: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChapterDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={editingChapter ? handleUpdateChapter : handleCreateChapter}>
                {editingChapter ? "保存" : "创建"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chapters List */}
      <div className="space-y-4">
        {chapters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              暂无章节，点击上方按钮添加
            </CardContent>
          </Card>
        ) : (
          chapters.map((chapter) => (
            <Card key={chapter.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div>
                      <CardTitle className="text-lg">{chapter.title}</CardTitle>
                      <CardDescription>{chapter.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{chapter.category}</Badge>
                    <Badge variant={chapter.is_theory ? "outline" : "default"}>
                      {chapter.is_theory ? "理论课" : "实战课"}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditChapter(chapter)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteChapter(chapter.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    {videos[chapter.id]?.length || 0} 个视频
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-4 w-4" />
                    {questions[chapter.id]?.length || 0} 道题目
                  </span>
                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedChapterId(chapter.id);
                      setVideoDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加视频
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedChapterId(chapter.id);
                      setQuestionDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加题目
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加视频</DialogTitle>
            <DialogDescription>上传视频文件或填写视频链接</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>视频标题</Label>
              <Input
                value={videoForm.title}
                onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                placeholder="视频标题"
              />
            </div>
            <div>
              <Label>上传视频</Label>
              <Input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-muted-foreground mt-1">上传中...</p>}
            </div>
            <div>
              <Label>或填写视频链接</Label>
              <Input
                value={videoForm.video_url}
                onChange={(e) => setVideoForm({ ...videoForm, video_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateVideo} disabled={uploading}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>添加测试题</DialogTitle>
            <DialogDescription>添加选择题</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>题目</Label>
              <Textarea
                value={questionForm.question}
                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                placeholder="输入题目内容"
              />
            </div>
            <div className="space-y-2">
              <Label>选项</Label>
              {questionForm.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[index] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    placeholder={`选项 ${index + 1}`}
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={questionForm.correct_answer === index}
                    onChange={() => setQuestionForm({ ...questionForm, correct_answer: index })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-muted-foreground">正确</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateQuestion}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourses;
