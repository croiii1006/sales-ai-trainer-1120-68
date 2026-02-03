import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Award,
  AlertCircle
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface SimulationSession {
  id: string;
  overall_score: number | null;
  dimension_scores: {
    needsDiscovery?: number;
    productKnowledge?: number;
    objectionHandling?: number;
    emotionalConnection?: number;
    closingSkill?: number;
  } | null;
  feedback: string | null;
  created_at: string;
}

interface DimensionData {
  dimension: string;
  score: number;
  fullMark: number;
}

const dimensionLabels: Record<string, string> = {
  needsDiscovery: "需求挖掘",
  productKnowledge: "产品知识",
  objectionHandling: "异议处理",
  emotionalConnection: "情绪连接",
  closingSkill: "成交引导",
};

const Reports = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SimulationSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("simulation_sessions")
        .select("id, overall_score, dimension_scores, feedback, created_at")
        .eq("user_id", user.id)
        .not("overall_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setSessions(data as SimulationSession[]);
      }
      setLoading(false);
    };

    fetchSessions();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">暂无评估数据</h2>
        <p className="text-muted-foreground">
          完成实战模拟后，您的能力报告将在这里显示
        </p>
      </div>
    );
  }

  // Calculate averages
  const avgScore = Math.round(
    sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessions.length
  );

  const dimensionAverages: Record<string, number[]> = {};
  sessions.forEach((s) => {
    if (s.dimension_scores) {
      Object.entries(s.dimension_scores).forEach(([key, value]) => {
        if (!dimensionAverages[key]) dimensionAverages[key] = [];
        if (typeof value === 'number') {
          dimensionAverages[key].push(value);
        }
      });
    }
  });

  const radarData: DimensionData[] = Object.entries(dimensionAverages).map(([key, values]) => ({
    dimension: dimensionLabels[key] || key,
    score: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    fullMark: 100,
  }));

  // Find strengths and weaknesses
  const sortedDimensions = [...radarData].sort((a, b) => b.score - a.score);
  const strengths = sortedDimensions.slice(0, 2);
  const weaknesses = sortedDimensions.slice(-2).reverse();

  // Score trend
  const trendData = sessions
    .slice(0, 10)
    .reverse()
    .map((s, index) => ({
      index: index + 1,
      score: s.overall_score || 0,
    }));

  const recentTrend = sessions.length >= 2 
    ? (sessions[0].overall_score || 0) - (sessions[1].overall_score || 0)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">能力报告</h1>
        <p className="text-muted-foreground">
          基于 {sessions.length} 次实战模拟的综合分析
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均得分</p>
                <p className="text-3xl font-bold">{avgScore}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">最近趋势</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">
                    {recentTrend > 0 ? "+" : ""}{recentTrend}
                  </p>
                  {recentTrend > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : recentTrend < 0 ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">模拟次数</p>
                <p className="text-3xl font-bold">{sessions.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>能力雷达图</CardTitle>
            <CardDescription>各维度平均得分分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="得分"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle>得分趋势</CardTitle>
            <CardDescription>最近 10 次模拟得分</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <Award className="h-5 w-5" />
              优势能力
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strengths.map((s) => (
              <div key={s.dimension} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.dimension}</span>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    {s.score} 分
                  </Badge>
                </div>
                <Progress value={s.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <AlertCircle className="h-5 w-5" />
              待提升能力
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weaknesses.map((s) => (
              <div key={s.dimension} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.dimension}</span>
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                    {s.score} 分
                  </Badge>
                </div>
                <Progress value={s.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      {sessions[0]?.feedback && (
        <Card>
          <CardHeader>
            <CardTitle>最新反馈</CardTitle>
            <CardDescription>
              来自最近一次模拟的 AI 教练建议
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {sessions[0].feedback}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
