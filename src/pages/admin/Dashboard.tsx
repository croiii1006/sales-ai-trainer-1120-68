import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  BookOpen, 
  Target, 
  TrendingUp,
  Award,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardStats {
  totalEmployees: number;
  totalChapters: number;
  avgScore: number;
  completionRate: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [teamProgress, setTeamProgress] = useState<any[]>([]);
  const [recentScores, setRecentScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all data in parallel
      const [
        profilesRes,
        chaptersRes,
        sessionsRes,
        progressRes,
        teamsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id, team_id"),
        supabase.from("course_chapters").select("id"),
        supabase.from("simulation_sessions").select("overall_score, created_at").not("overall_score", "is", null),
        supabase.from("learning_progress").select("user_id, completed_at"),
        supabase.from("teams").select("id, name"),
      ]);

      const profiles = profilesRes.data || [];
      const chapters = chaptersRes.data || [];
      const sessions = sessionsRes.data || [];
      const progress = progressRes.data || [];
      const teams = teamsRes.data || [];

      // Calculate stats
      const totalEmployees = profiles.length;
      const totalChapters = chapters.length;
      const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessions.length)
        : 0;
      
      const uniqueUsers = new Set(progress.map(p => p.user_id));
      const completedUsers = new Set(
        progress.filter(p => p.completed_at).map(p => p.user_id)
      );
      const completionRate = uniqueUsers.size > 0
        ? Math.round((completedUsers.size / uniqueUsers.size) * 100)
        : 0;

      setStats({
        totalEmployees,
        totalChapters,
        avgScore,
        completionRate,
      });

      // Team progress
      const teamData = teams.map(team => {
        const teamMembers = profiles.filter(p => p.team_id === team.id);
        const teamProgress = progress.filter(p => 
          teamMembers.some(m => m.id === p.user_id)
        );
        const completed = teamProgress.filter(p => p.completed_at).length;
        const total = teamMembers.length * chapters.length;
        
        return {
          name: team.name,
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      });
      setTeamProgress(teamData);

      // Recent scores trend (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentSessions = sessions.filter(s => 
        new Date(s.created_at) >= sevenDaysAgo
      );
      
      const scoresByDay: Record<string, number[]> = {};
      recentSessions.forEach(s => {
        const date = new Date(s.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        if (!scoresByDay[date]) scoresByDay[date] = [];
        scoresByDay[date].push(s.overall_score || 0);
      });

      const trendData = Object.entries(scoresByDay).map(([date, scores]) => ({
        date,
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        count: scores.length,
      }));
      setRecentScores(trendData);

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "已完成", value: stats?.completionRate || 0 },
    { name: "未完成", value: 100 - (stats?.completionRate || 0) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">仪表盘</h1>
        <p className="text-muted-foreground">培训系统整体数据概览</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">员工总数</p>
                <p className="text-3xl font-bold">{stats?.totalEmployees || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">课程章节</p>
                <p className="text-3xl font-bold">{stats?.totalChapters || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均得分</p>
                <p className="text-3xl font-bold">{stats?.avgScore || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">完成率</p>
                <p className="text-3xl font-bold">{stats?.completionRate || 0}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              近期得分趋势
            </CardTitle>
            <CardDescription>过去 7 天的平均得分</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {recentScores.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="avgScore" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <Clock className="h-8 w-8 mr-2" />
                  暂无近期数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              团队完成进度
            </CardTitle>
            <CardDescription>各团队课程完成情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {teamProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamProgress} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <Users className="h-8 w-8 mr-2" />
                  暂无团队数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>整体完成情况</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
