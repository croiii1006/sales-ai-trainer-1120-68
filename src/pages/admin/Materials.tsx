import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, FileText, Trash2, Download, File, FileVideo, FileImage, Tag, X, Search, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-8 w-8 text-red-500" />,
  video: <FileVideo className="h-8 w-8 text-blue-500" />,
  image: <FileImage className="h-8 w-8 text-green-500" />,
  default: <File className="h-8 w-8 text-muted-foreground" />,
};

const CATEGORIES = ["通用", "产品知识", "销售技巧", "客户服务", "沟通话术", "异议处理"];
const DIFFICULTIES = ["初级", "中级", "高级"];
const POSITIONS = ["通用", "销售顾问", "客户经理", "销售主管", "门店经理"];

const difficultyColors: Record<string, string> = {
  "初级": "bg-green-500/20 text-green-500",
  "中级": "bg-yellow-500/20 text-yellow-500",
  "高级": "bg-red-500/20 text-red-500",
};

const AdminMaterials = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    file_url: "",
    file_type: "",
    category: "通用",
    tags: [] as string[],
    difficulty: "初级",
    position: "通用",
  });

  const [tagInput, setTagInput] = useState("");

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from("training_materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setMaterials(data as TrainingMaterial[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const filePath = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("training-materials")
      .upload(filePath, file);

    if (error) {
      toast({ title: "上传失败", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("training-materials")
      .getPublicUrl(filePath);

    let fileType = "other";
    if (fileExt === "pdf") fileType = "pdf";
    else if (["mp4", "mov", "avi", "webm"].includes(fileExt || "")) fileType = "video";
    else if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExt || "")) fileType = "image";
    else if (["doc", "docx"].includes(fileExt || "")) fileType = "document";
    else if (["ppt", "pptx"].includes(fileExt || "")) fileType = "presentation";

    setForm({
      ...form,
      title: form.title || file.name.replace(/\.[^/.]+$/, ""),
      file_url: publicUrl,
      file_type: fileType,
    });
    setUploading(false);
    toast({ title: "文件上传成功" });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.file_url) {
      toast({ title: "请填写标题并上传文件", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("training_materials").insert({
      title: form.title,
      description: form.description || null,
      file_url: form.file_url,
      file_type: form.file_type,
      category: form.category,
      tags: form.tags,
      difficulty: form.difficulty,
      position: form.position,
      uploaded_by: user?.id,
    });

    if (error) {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "资料添加成功" });
      setDialogOpen(false);
      setForm({ 
        title: "", 
        description: "", 
        file_url: "", 
        file_type: "",
        category: "通用",
        tags: [],
        difficulty: "初级",
        position: "通用",
      });
      fetchMaterials();
    }
  };

  const handleDelete = async (material: TrainingMaterial) => {
    if (!confirm("确定要删除这个培训资料吗？")) return;

    const urlParts = material.file_url.split("/");
    const fileName = urlParts[urlParts.length - 1];
    await supabase.storage.from("training-materials").remove([fileName]);

    const { error } = await supabase.from("training_materials").delete().eq("id", material.id);
    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "资料已删除" });
      fetchMaterials();
    }
  };

  const getFileIcon = (fileType: string) => {
    return fileTypeIcons[fileType] || fileTypeIcons.default;
  };

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchQuery === "" || 
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === "all" || material.category === filterCategory;
    const matchesDifficulty = filterDifficulty === "all" || material.difficulty === filterDifficulty;
    const matchesPosition = filterPosition === "all" || material.position === filterPosition;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesPosition;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">培训资料</h1>
          <p className="text-muted-foreground">上传和管理培训文档、视频等资料</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              上传资料
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>上传培训资料</DialogTitle>
              <DialogDescription>上传文档、视频或其他培训材料</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>选择文件</Label>
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.jpg,.jpeg,.png,.gif"
                />
                {uploading && <p className="text-sm text-muted-foreground mt-1">上传中...</p>}
                {form.file_url && (
                  <p className="text-sm text-green-500 mt-1">✓ 文件已上传</p>
                )}
              </div>
              <div>
                <Label>标题</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="资料标题"
                />
              </div>
              <div>
                <Label>描述（可选）</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="资料描述"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>分类</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>难度</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map(diff => (
                        <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>适用岗位</Label>
                <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>标签</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="输入标签后按回车添加"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleCreate} disabled={uploading}>添加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索资料名称、描述或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="难度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部难度</SelectItem>
                  {DIFFICULTIES.map(diff => (
                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="岗位" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部岗位</SelectItem>
                  {POSITIONS.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            {materials.length === 0 
              ? "暂无培训资料，点击上方按钮上传"
              : "没有找到匹配的资料，请尝试其他筛选条件"
            }
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  {getFileIcon(material.file_type)}
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
                    <Badge variant="outline" className="text-xs">{material.category}</Badge>
                    <Badge className={`text-xs ${difficultyColors[material.difficulty] || ''}`}>
                      {material.difficulty}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{material.position}</Badge>
                  </div>
                  {material.tags && material.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {material.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs bg-muted">
                          <Tag className="h-2.5 w-2.5 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {material.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-muted">
                          +{material.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      {new Date(material.created_at).toLocaleDateString("zh-CN")}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(material.file_url, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(material)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMaterials;
