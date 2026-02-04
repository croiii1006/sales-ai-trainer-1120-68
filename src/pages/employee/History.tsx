import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Clock,
  Target,
  MessageCircle,
  Sparkles,
  ChevronRight,
  User,
  Bot
} from "lucide-react";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  annotation?: string;
}

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
  messages: Message[];
  created_at: string;
  scenario: string;
  persona: string;
  brand: string;
}

const dimensionLabels: Record<string, string> = {
  needsDiscovery: "需求挖掘",
  productKnowledge: "产品知识",
  objectionHandling: "异议处理",
  emotionalConnection: "情绪连接",
  closingSkill: "成交引导"
};

// Mock data for demonstration
const mockSessions: SimulationSession[] = [
  {
    id: "1",
    overall_score: 85,
    dimension_scores: {
      needsDiscovery: 88,
      productKnowledge: 92,
      objectionHandling: 78,
      emotionalConnection: 85,
      closingSkill: 82
    },
    feedback: "表现出色！在产品知识方面展现了深厚的功底，建议在异议处理上多加练习。",
    messages: [
      { role: "assistant", content: "您好，欢迎光临！请问有什么可以帮您的？", timestamp: "00:00" },
      { role: "user", content: "我想看看你们的新款手表", timestamp: "00:05" },
      { role: "assistant", content: "好的，我们最近刚推出了几款新品。请问您是自己佩戴还是送人呢？", timestamp: "00:12", annotation: "需求挖掘：主动询问购买目的，表现良好" },
      { role: "user", content: "自己戴，想要商务风格的", timestamp: "00:20" },
      { role: "assistant", content: "明白了。根据您的需求，我推荐这款经典商务系列，采用瑞士机芯，表盘设计简约大气，非常适合商务场合佩戴。", timestamp: "00:28", annotation: "产品知识：准确推荐，专业度高" },
    ],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    scenario: "高端客户接待",
    persona: "商务精英",
    brand: "经典系列"
  },
  {
    id: "2",
    overall_score: 78,
    dimension_scores: {
      needsDiscovery: 75,
      productKnowledge: 85,
      objectionHandling: 72,
      emotionalConnection: 80,
      closingSkill: 78
    },
    feedback: "整体表现良好，需求挖掘还可以更深入。",
    messages: [
      { role: "assistant", content: "您好，欢迎光临！", timestamp: "00:00" },
      { role: "user", content: "随便看看", timestamp: "00:03" },
      { role: "assistant", content: "好的，请随意浏览。有任何问题随时问我。", timestamp: "00:08" },
    ],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    scenario: "随意浏览客户",
    persona: "休闲消费者",
    brand: "运动系列"
  },
  {
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
    messages: [],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    scenario: "价格敏感客户",
    persona: "理性消费者",
    brand: "经典系列"
  }
];

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SimulationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SimulationSession | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("simulation_sessions")
        .select("id, overall_score, dimension_scores, feedback, messages, created_at, scenario, persona, brand")
        .eq("user_id", user.id)
        .not("overall_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        const sessions = data.map(d => ({
          ...d,
          messages: Array.isArray(d.messages) ? (d.messages as unknown as Message[]) : [],
          dimension_scores: d.dimension_scores as SimulationSession['dimension_scores']
        }));
        setSessions(sessions);
      } else {
        setSessions(mockSessions);
      }
      setLoading(false);
    };
    fetchSessions();
  }, [user]);

  const displaySessions = sessions.length > 0 ? sessions : mockSessions;

  // 计算趋势数据
  const trendData = displaySessions.slice(0, 10).reverse().map((s, index) => {
    const scores: Record<string, number> = { index: index + 1 };
    if (s.dimension_scores) {
      Object.entries(s.dimension_scores).forEach(([key, value]) => {
        if (typeof value === 'number') {
          scores[dimensionLabels[key] || key] = value;
        }
      });
    }
    return scores;
  });

  // 计算个人历史均值
  const avgScores: Record<string, number> = {};
  displaySessions.forEach(s => {
    if (s.dimension_scores) {
      Object.entries(s.dimension_scores).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (!avgScores[key]) avgScores[key] = 0;
          avgScores[key] += value;
        }
      });
    }
  });
  Object.keys(avgScores).forEach(key => {
    avgScores[key] = Math.round(avgScores[key] / displaySessions.length);
  });

  const radarData = Object.entries(avgScores).map(([key, value]) => ({
    dimension: dimensionLabels[key] || key,
    个人均值: value,
    fullMark: 100
  }));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getScoreTrend = (index: number) => {
    if (index >= displaySessions.length - 1) return 0;
    return (displaySessions[index].overall_score || 0) - (displaySessions[index + 1].overall_score || 0);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">历史记录</h1>
          <p className="text-muted-foreground">
            共 {displaySessions.length} 次实战模拟记录
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">能力趋势</TabsTrigger>
          <TabsTrigger value="sessions">实战记录</TabsTrigger>
          {selectedSession && <TabsTrigger value="detail">对话详情</TabsTrigger>}
        </TabsList>

        {/* 能力趋势对比 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 趋势图 */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  维度能力趋势
                </CardTitle>
                <CardDescription>最近 {trendData.length} 次模拟的各维度变化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="index" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="需求挖掘" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="产品知识" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="异议处理" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="情绪连接" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="成交引导" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 个人均值雷达图 */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  个人历史均值
                </CardTitle>
                <CardDescription>基于全部记录的平均能力分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Radar name="个人均值" dataKey="个人均值" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 实战记录列表 */}
        <TabsContent value="sessions" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                实战对话记录
              </CardTitle>
              <CardDescription>点击查看完整对话内容与AI评价批注</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {displaySessions.map((session, index) => {
                    const trend = getScoreTrend(index);
                    return (
                      <div
                        key={session.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedSession(session);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-bold text-primary">{session.overall_score}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{session.scenario}</span>
                                <Badge variant="secondary">{session.brand}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(session.created_at)}
                                <span>·</span>
                                <span>{session.persona}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {trend !== 0 && (
                              <div className={`flex items-center gap-1 text-sm ${trend > 0 ? "text-green-500" : "text-destructive"}`}>
                                {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                {trend > 0 ? "+" : ""}{trend}
                              </div>
                            )}
                            {trend === 0 && index < displaySessions.length - 1 && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Minus className="h-4 w-4" />
                                0
                              </div>
                            )}
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                        {session.feedback && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                            {session.feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 对话详情 */}
        {selectedSession && (
          <TabsContent value="detail" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 对话记录 */}
              <Card className="shadow-card lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        对话记录
                      </CardTitle>
                      <CardDescription>{selectedSession.scenario} - {formatDate(selectedSession.created_at)}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {selectedSession.overall_score} 分
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {selectedSession.messages && selectedSession.messages.length > 0 ? (
                        selectedSession.messages.map((msg, index) => (
                          <div key={index} className="space-y-2">
                            <div className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                msg.role === "user" ? "bg-primary" : "bg-muted"
                              }`}>
                                {msg.role === "user" ? (
                                  <User className="h-4 w-4 text-primary-foreground" />
                                ) : (
                                  <Bot className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className={`flex-1 max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}>
                                <div className={`inline-block p-3 rounded-lg ${
                                  msg.role === "user" 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted"
                                }`}>
                                  <p className="text-sm">{msg.content}</p>
                                </div>
                                {msg.timestamp && (
                                  <p className="text-xs text-muted-foreground mt-1">{msg.timestamp}</p>
                                )}
                              </div>
                            </div>
                            {msg.annotation && (
                              <div className={`flex ${msg.role === "user" ? "justify-end mr-11" : "ml-11"}`}>
                                <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 max-w-[80%]">
                                  <div className="flex items-center gap-2 text-xs text-primary mb-1">
                                    <Sparkles className="h-3 w-3" />
                                    AI 评价批注
                                  </div>
                                  <p className="text-sm">{msg.annotation}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          暂无对话记录
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 评分摘要 */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    自动评分与摘要
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 各维度得分 */}
                  <div className="space-y-3">
                    {selectedSession.dimension_scores && Object.entries(selectedSession.dimension_scores).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{dimensionLabels[key] || key}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI 反馈 */}
                  {selectedSession.feedback && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">AI 教练总结</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedSession.feedback}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default History;
