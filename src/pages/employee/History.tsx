import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Clock,
  ChevronRight,
  MessageSquare
} from "lucide-react";

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
    feedback: "对客户情绪把握准确，产品介绍清晰流畅。",
    messages: [],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    scenario: "价格敏感客户",
    persona: "理性消费者",
    brand: "经典系列"
  },
  {
    id: "4",
    overall_score: 72,
    dimension_scores: {
      needsDiscovery: 70,
      productKnowledge: 78,
      objectionHandling: 68,
      emotionalConnection: 75,
      closingSkill: 69
    },
    feedback: "异议处理需要加强，可以更耐心地倾听客户疑虑。",
    messages: [],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    scenario: "异议处理训练",
    persona: "挑剔型客户",
    brand: "限量系列"
  },
  {
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
    messages: [],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    scenario: "成交引导训练",
    persona: "犹豫型客户",
    brand: "新品系列"
  }
];

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SimulationSession[]>([]);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", { 
      year: "numeric",
      month: "long", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const getScoreTrend = (index: number) => {
    if (index >= displaySessions.length - 1) return 0;
    return (displaySessions[index].overall_score || 0) - (displaySessions[index + 1].overall_score || 0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-primary";
    return "text-destructive";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
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

      {/* Sessions List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            训练记录
          </CardTitle>
          <CardDescription>点击查看完整训练详情</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-280px)] pr-4">
            <div className="space-y-3">
              {displaySessions.map((session, index) => {
                const trend = getScoreTrend(index);
                return (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md"
                    onClick={() => navigate(`/history/${session.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-full bg-muted flex items-center justify-center ${getScoreColor(session.overall_score || 0)}`}>
                          <span className="text-xl font-bold">{session.overall_score}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-lg">{session.scenario}</span>
                            <Badge variant="secondary">{session.brand}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(session.created_at)}
                            </div>
                            <span>·</span>
                            <span>{session.persona}</span>
                          </div>
                          {session.feedback && (
                            <p className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                              {session.feedback}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {trend !== 0 && (
                          <div className={`flex items-center gap-1 text-sm font-medium ${trend > 0 ? "text-green-500" : "text-destructive"}`}>
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
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default History;
