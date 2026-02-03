import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TrendingUp, Target, Award, AlertCircle, Sparkles } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
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
  closingSkill: "成交引导"
};

// Mock data for demonstration
const mockSessions: SimulationSession[] = [{
  id: "1",
  overall_score: 85,
  dimension_scores: {
    needsDiscovery: 88,
    productKnowledge: 92,
    objectionHandling: 78,
    emotionalConnection: 85,
    closingSkill: 82
  },
  feedback: "表现出色！在产品知识方面展现了深厚的功底，建议在异议处理上多加练习，学会用更柔和的方式化解客户疑虑。",
  created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
}, {
  id: "2",
  overall_score: 78,
  dimension_scores: {
    needsDiscovery: 75,
    productKnowledge: 85,
    objectionHandling: 72,
    emotionalConnection: 80,
    closingSkill: 78
  },
  feedback: "整体表现良好，需求挖掘还可以更深入，试着多问开放式问题。",
  created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
}, {
  id: "3",
  overall_score: 82,
  dimension_scores: {
    needsDiscovery: 85,
    productKnowledge: 88,
    objectionHandling: 75,
    emotionalConnection: 82,
    closingSkill: 80
  },
  feedback: null,
  created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
}, {
  id: "4",
  overall_score: 72,
  dimension_scores: {
    needsDiscovery: 70,
    productKnowledge: 78,
    objectionHandling: 68,
    emotionalConnection: 75,
    closingSkill: 69
  },
  feedback: null,
  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
}, {
  id: "5",
  overall_score: 88,
  dimension_scores: {
    needsDiscovery: 90,
    productKnowledge: 92,
    objectionHandling: 85,
    emotionalConnection: 88,
    closingSkill: 85
  },
  feedback: "进步明显！成交引导技巧有很大提升。",
  created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
}, {
  id: "6",
  overall_score: 75,
  dimension_scores: {
    needsDiscovery: 72,
    productKnowledge: 80,
    objectionHandling: 70,
    emotionalConnection: 78,
    closingSkill: 75
  },
  feedback: null,
  created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
}];

// Circular progress component
const CircularProgress = ({
  value,
  size = 80,
  strokeWidth = 6
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - value / 100 * circumference;
  return <div className="relative" style={{
    width: size,
    height: size
  }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-muted" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-primary transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{value}%</span>
      </div>
    </div>;
};
const Reports = () => {
  const {
    user
  } = useAuth();
  const [sessions, setSessions] = useState<SimulationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      const {
        data
      } = await supabase.from("simulation_sessions").select("id, overall_score, dimension_scores, feedback, created_at").eq("user_id", user.id).not("overall_score", "is", null).order("created_at", {
        ascending: false
      }).limit(20);
      if (data) {
        setSessions(data as SimulationSession[]);
      }
      setLoading(false);
    };
    fetchSessions();
  }, [user]);

  // Use mock data if enabled or if no real data exists
  const displaySessions = useMemo(() => {
    if (useMockData || sessions.length === 0) {
      return mockSessions;
    }
    return sessions;
  }, [sessions, useMockData]);
  const isMockMode = useMockData || sessions.length === 0;
  if (loading) {
    return <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>;
  }

  // Calculate averages
  const avgScore = Math.round(displaySessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / displaySessions.length);
  const dimensionAverages: Record<string, number[]> = {};
  displaySessions.forEach(s => {
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
    fullMark: 100
  }));

  // Find strengths and weaknesses
  const sortedDimensions = [...radarData].sort((a, b) => b.score - a.score);
  const strengths = sortedDimensions.slice(0, 2);
  const weaknesses = sortedDimensions.slice(-2).reverse();

  // Score trend
  const trendData = displaySessions.slice(0, 10).reverse().map((s, index) => ({
    index: index + 1,
    score: s.overall_score || 0
  }));
  const recentTrend = displaySessions.length >= 2 ? (displaySessions[0].overall_score || 0) - (displaySessions[1].overall_score || 0) : 0;
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">能力报告</h1>
          <p className="text-muted-foreground">
            基于 {displaySessions.length} 次实战模拟的综合分析
          </p>
        </div>
        
        {/* Mock data toggle */}
        <div className="flex items-center gap-2">
          {isMockMode && <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              演示数据
            </Badge>}
          <div className="flex items-center space-x-2">
            <Switch id="mock-mode" checked={useMockData} onCheckedChange={setUseMockData} />
            <Label htmlFor="mock-mode" className="text-sm text-muted-foreground">
              演示模式
            </Label>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">平均得分</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{avgScore}</p>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
              </div>
              <CircularProgress value={avgScore} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">最近趋势</p>
                <div className="flex items-center gap-2">
                  <p className="text-4xl font-bold">
                    {recentTrend > 0 ? "+" : ""}{recentTrend}
                  </p>
                  {recentTrend > 0 && <span className="text-sm text-green-500 font-medium">
                      +{Math.abs(recentTrend)}%
                    </span>}
                  {recentTrend < 0 && <span className="text-sm text-destructive font-medium">
                      {recentTrend}%
                    </span>}
                </div>
              </div>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">模拟次数</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{displaySessions.length}</p>
                  <span className="text-sm text-muted-foreground">次</span>
                </div>
              </div>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>能力雷达图</CardTitle>
            <CardDescription>各维度平均得分分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="dimension" tick={{
                  fontSize: 12,
                  fill: "hsl(var(--foreground))"
                }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{
                  fill: "hsl(var(--muted-foreground))"
                }} />
                  <Radar name="得分" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score Trend - Bar Chart */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>得分趋势</CardTitle>
              <CardDescription>最近 {trendData.length} 次模拟得分</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-muted">
              过去 30 天
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="index" tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 12
                }} axisLine={{
                  stroke: "hsl(var(--border))"
                }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 12
                }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))"
                }} formatter={(value: number) => [`${value} 分`, "得分"]} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {trendData.map((_, index) => <Cell key={`cell-${index}`} fill={index === trendData.length - 1 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-500 text-lg">
              <Award className="h-5 w-5" />
              优势能力
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strengths.map(s => <div key={s.dimension} className="flex items-center gap-4">
                <CircularProgress value={s.score} size={56} strokeWidth={4} />
                <div className="flex-1">
                  <span className="font-medium">{s.dimension}</span>
                  <Progress value={s.score} className="h-2 mt-2" indicatorClassName="bg-green-500" />
                </div>
              </div>)}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary text-lg">
              <AlertCircle className="h-5 w-5" />
              待提升能力
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weaknesses.map(s => <div key={s.dimension} className="flex items-center gap-4">
                <CircularProgress value={s.score} size={56} strokeWidth={4} />
                <div className="flex-1">
                  <span className="font-medium">{s.dimension}</span>
                  <Progress value={s.score} className="h-2 mt-2" indicatorClassName="bg-primary" />
                </div>
              </div>)}
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      {displaySessions[0]?.feedback && <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>AI 教练建议</CardTitle>
                <CardDescription>来自最近一次模拟的反馈</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {displaySessions[0].feedback}
            </p>
          </CardContent>
        </Card>}
    </div>;
};
export default Reports;