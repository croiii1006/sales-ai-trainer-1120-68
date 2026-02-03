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
import { Plus, Building2, Pencil, Trash2, Users } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface TeamWithStats extends Team {
  memberCount: number;
}

const AdminTeams = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const fetchTeams = async () => {
    const [teamsRes, profilesRes] = await Promise.all([
      supabase.from("teams").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("team_id"),
    ]);

    const teamsData = teamsRes.data || [];
    const profiles = profilesRes.data || [];

    const teamsWithStats: TeamWithStats[] = teamsData.map((team) => ({
      ...team,
      memberCount: profiles.filter((p) => p.team_id === team.id).length,
    }));

    setTeams(teamsWithStats);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "请输入团队名称", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("teams").insert({
      name: form.name,
      description: form.description || null,
    });

    if (error) {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "团队创建成功" });
      setDialogOpen(false);
      setForm({ name: "", description: "" });
      fetchTeams();
    }
  };

  const handleUpdate = async () => {
    if (!editingTeam || !form.name.trim()) return;

    const { error } = await supabase
      .from("teams")
      .update({
        name: form.name,
        description: form.description || null,
      })
      .eq("id", editingTeam.id);

    if (error) {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "团队更新成功" });
      setDialogOpen(false);
      setEditingTeam(null);
      setForm({ name: "", description: "" });
      fetchTeams();
    }
  };

  const handleDelete = async (team: Team) => {
    if (!confirm(`确定要删除团队 "${team.name}" 吗？团队成员将变为未分配状态。`)) return;

    const { error } = await supabase.from("teams").delete().eq("id", team.id);
    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "团队已删除" });
      fetchTeams();
    }
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setForm({ name: team.name, description: team.description || "" });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">团队管理</h1>
          <p className="text-muted-foreground">创建和管理培训团队/门店</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingTeam(null);
              setForm({ name: "", description: "" });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              创建团队
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTeam ? "编辑团队" : "创建团队"}</DialogTitle>
              <DialogDescription>填写团队信息</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>团队名称</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：北京国贸店"
                />
              </div>
              <div>
                <Label>描述（可选）</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="团队描述"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={editingTeam ? handleUpdate : handleCreate}>
                {editingTeam ? "保存" : "创建"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            暂无团队，点击上方按钮创建
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {team.description || "暂无描述"}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {team.memberCount} 名成员
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(team)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(team)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  创建于 {new Date(team.created_at).toLocaleDateString("zh-CN")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTeams;
