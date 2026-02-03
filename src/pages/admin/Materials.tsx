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
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Trash2, Download, File, FileVideo, FileImage } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TrainingMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  created_at: string;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-8 w-8 text-red-500" />,
  video: <FileVideo className="h-8 w-8 text-blue-500" />,
  image: <FileImage className="h-8 w-8 text-green-500" />,
  default: <File className="h-8 w-8 text-gray-500" />,
};

const AdminMaterials = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    file_url: "",
    file_type: "",
  });

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from("training_materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setMaterials(data);
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
      uploaded_by: user?.id,
    });

    if (error) {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "资料添加成功" });
      setDialogOpen(false);
      setForm({ title: "", description: "", file_url: "", file_type: "" });
      fetchMaterials();
    }
  };

  const handleDelete = async (material: TrainingMaterial) => {
    if (!confirm("确定要删除这个培训资料吗？")) return;

    // Delete from storage
    const urlParts = material.file_url.split("/");
    const fileName = urlParts[urlParts.length - 1];
    await supabase.storage.from("training-materials").remove([fileName]);

    // Delete from database
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
          <DialogContent>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleCreate} disabled={uploading}>添加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            暂无培训资料，点击上方按钮上传
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((material) => (
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
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{material.file_type}</Badge>
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
                <p className="text-xs text-muted-foreground mt-2">
                  上传于 {new Date(material.created_at).toLocaleDateString("zh-CN")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMaterials;
