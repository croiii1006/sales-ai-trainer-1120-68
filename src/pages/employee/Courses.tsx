import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckCircle, Play, Clock, Search, FileText, Download, Tag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
interface TrainingMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  category: string;
  tags: string[];
  difficulty: string;
  position: string;
  created_at: string;
}
const categoryColors: Record<string, string> = {
  "概述": "bg-blue-500/20 text-blue-500",
  "社交技巧": "bg-green-500/20 text-green-500",
  "产品知识": "bg-purple-500/20 text-purple-500",
  "销售技巧": "bg-orange-500/20 text-orange-500",
  "客户服务": "bg-pink-500/20 text-pink-500",
  "异议处理": "bg-yellow-500/20 text-yellow-500",
  "沟通话术": "bg-cyan-500/20 text-cyan-500",
  "通用": "bg-gray-500/20 text-gray-500"
};
const difficultyColors: Record<string, string> = {
  "初级": "bg-green-500/20 text-green-500",
  "中级": "bg-yellow-500/20 text-yellow-500",
  "高级": "bg-red-500/20 text-red-500"
};
const CATEGORIES = ["通用", "产品知识", "销售技巧", "客户服务", "沟通话术", "异议处理"];
const DIFFICULTIES = ["初级", "中级", "高级"];
const POSITIONS = ["通用", "销售顾问", "客户经理", "销售主管", "门店经理"];
const Courses = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<Record<string, LearningProgress>>({});
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [chaptersRes, progressRes, materialsRes] = await Promise.all([supabase.from("course_chapters").select("*").order("order_index", {
        ascending: true
      }), supabase.from("learning_progress").select("*").eq("user_id", user.id), supabase.from("training_materials").select("*").order("created_at", {
        ascending: false
      })]);
      if (chaptersRes.data) {
        setChapters(chaptersRes.data);
      }
      if (progressRes.data) {
        const progressMap: Record<string, LearningProgress> = {};
        progressRes.data.forEach(p => {
          progressMap[p.chapter_id] = p;
        });
        setProgress(progressMap);
      }
      if (materialsRes.data) {
        setMaterials(materialsRes.data as TrainingMaterial[]);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);
  const getChapterProgress = (chapter: Chapter): number => {
    const p = progress[chapter.id];
    if (!p) return 0;
    let total = 2;
    let completed = 0;
    if (p.video_completed) completed++;
    if (p.quiz_score !== null) completed++;
    if (!chapter.is_theory) {
      total++;
      if (p.simulation_completed) completed++;
    }
    return Math.round(completed / total * 100);
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

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchQuery === "" || material.title.toLowerCase().includes(searchQuery.toLowerCase()) || material.description?.toLowerCase().includes(searchQuery.toLowerCase()) || material.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === "all" || material.category === filterCategory;
    const matchesDifficulty = filterDifficulty === "all" || material.difficulty === filterDifficulty;
    const matchesPosition = filterPosition === "all" || material.position === filterPosition;
    return matchesSearch && matchesCategory && matchesDifficulty && matchesPosition;
  });

  // Filter chapters
  const filteredGroupedChapters = Object.entries(groupedChapters).reduce((acc, [category, categoryChapters]) => {
    const filtered = categoryChapters.filter(chapter => {
      const matchesSearch = searchQuery === "" || chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) || chapter.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "all" || chapter.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, Chapter[]>);
  if (loading) {
    return <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">学习中心</h1>
        <p className="text-muted-foreground">
          完成视频学习和测试，掌握销售技能
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            网课学习
          </TabsTrigger>
          <TabsTrigger value="materials" className="gap-2">
            <FileText className="h-4 w-4" />
            培训资料
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={activeTab === "courses" ? "搜索课程..." : "搜索资料名称、描述或标签..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                {activeTab === "materials" && <>
                    <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="难度" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部难度</SelectItem>
                        {DIFFICULTIES.map(diff => <SelectItem key={diff} value={diff}>{diff}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterPosition} onValueChange={setFilterPosition}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="岗位" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部岗位</SelectItem>
                        {POSITIONS.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </>}
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="courses" className="space-y-6 mt-4">
          {/* Overall Progress */}
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">总体学习进度</span>
              <span className="text-sm text-muted-foreground">
                {Object.values(progress).filter(p => p.completed_at).length} / {chapters.length} 章节完成
              </span>
            </div>
            <Progress value={chapters.length > 0 ? Object.values(progress).filter(p => p.completed_at).length / chapters.length * 100 : 0} className="h-2" />
          </div>

          {Object.keys(filteredGroupedChapters).length === 0 ? <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {chapters.length === 0 ? "暂无课程，请稍后再来查看" : "没有找到匹配的课程，请尝试其他筛选条件"}
              </CardContent>
            </Card> : Object.entries(filteredGroupedChapters).map(([category, categoryChapters]) => <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={categoryColors[category] || "bg-gray-500/20 text-gray-500"}>
                    {category}
                  </Badge>
                  
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryChapters.map(chapter => {
              const status = getChapterStatus(chapter);
              const progressValue = getChapterProgress(chapter);
              return <Card key={chapter.id} className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate(`/courses/${chapter.id}`)}>
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
                            {status === "completed" ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> : status === "in_progress" ? <Clock className="h-5 w-5 text-yellow-500 shrink-0" /> : <Play className="h-5 w-5 text-muted-foreground shrink-0" />}
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
                      </Card>;
            })}
                </div>
              </div>)}
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          {filteredMaterials.length === 0 ? <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {materials.length === 0 ? "暂无培训资料" : "没有找到匹配的资料，请尝试其他筛选条件"}
              </CardContent>
            </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map(material => <Card key={material.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{material.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {material.description || "暂无描述"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge className={categoryColors[material.category] || "bg-gray-500/20 text-gray-500"}>
                          {material.category}
                        </Badge>
                        <Badge className={difficultyColors[material.difficulty] || ''}>
                          {material.difficulty}
                        </Badge>
                        <Badge variant="secondary">{material.position}</Badge>
                      </div>
                      {material.tags && material.tags.length > 0 && <div className="flex flex-wrap gap-1">
                          {material.tags.slice(0, 3).map(tag => <Badge key={tag} variant="outline" className="text-xs bg-muted">
                              <Tag className="h-2.5 w-2.5 mr-1" />
                              {tag}
                            </Badge>)}
                          {material.tags.length > 3 && <Badge variant="outline" className="text-xs bg-muted">
                              +{material.tags.length - 3}
                            </Badge>}
                        </div>}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {new Date(material.created_at).toLocaleDateString("zh-CN")}
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => window.open(material.file_url, "_blank")} className="gap-1">
                          <Download className="h-4 w-4" />
                          下载
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
        </TabsContent>
      </Tabs>
    </div>;
};
export default Courses;