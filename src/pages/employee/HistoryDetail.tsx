import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Clock,
  MessageCircle,
  Target,
  Sparkles,
  User,
  Bot
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

const dimensionLabels: Record<string, string> = {
  needsDiscovery: "需求挖掘",
  productKnowledge: "产品知识",
  objectionHandling: "异议处理",
  emotionalConnection: "情绪连接",
  closingSkill: "成交引导"
};

// Mock data for demonstration
const mockSession: SimulationSession = {
  id: "1",
  overall_score: 85,
  dimension_scores: {
    needsDiscovery: 88,
    productKnowledge: 92,
    objectionHandling: 78,
    emotionalConnection: 85,
    closingSkill: 82
  },
  feedback: "表现出色！在产品知识方面展现了深厚的功底，建议在异议处理上多加练习，学会用更柔和的方式化解客户疑虑。整体沟通流畅，客户体验良好。",
  messages: [
    { role: "assistant", content: "您好，欢迎光临！请问有什么可以帮您的？", timestamp: "00:00" },
    { role: "user", content: "我想看看你们的新款手表", timestamp: "00:05" },
    { role: "assistant", content: "好的，我们最近刚推出了几款新品。请问您是自己佩戴还是送人呢？", timestamp: "00:12", annotation: "需求挖掘：主动询问购买目的，表现良好" },
    { role: "user", content: "自己戴，想要商务风格的", timestamp: "00:20" },
    { role: "assistant", content: "明白了。根据您的需求，我推荐这款经典商务系列，采用瑞士机芯，表盘设计简约大气，非常适合商务场合佩戴。", timestamp: "00:28", annotation: "产品知识：准确推荐，专业度高" },
    { role: "user", content: "价格是多少？感觉有点贵", timestamp: "00:35" },
    { role: "assistant", content: "这款的价格是28,800元。这个价位在同级别瑞士机芯手表中其实很有竞争力。而且我们现在有分期付款的选项，可以让您更轻松地拥有它。", timestamp: "00:45", annotation: "异议处理：对价格异议的回应可以更有技巧，建议先肯定客户的感受" },
    { role: "user", content: "让我再考虑一下", timestamp: "00:55" },
    { role: "assistant", content: "当然可以，这是一个重要的决定。不过今天我们有一个限时活动，购买可以获得原厂表带一条和两年延保服务，价值超过2000元。您可以先试戴感受一下。", timestamp: "01:05", annotation: "成交引导：适时使用限时优惠促进决策，手法成熟" },
  ],
  created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  scenario: "高端客户接待",
  persona: "商务精英",
  brand: "经典系列"
};

const HistoryDetail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SimulationSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (!user || !sessionId) return;
      
      const { data } = await supabase
        .from("simulation_sessions")
        .select("id, overall_score, dimension_scores, feedback, messages, created_at, scenario, persona, brand")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSession({
          ...data,
          messages: Array.isArray(data.messages) ? (data.messages as unknown as Message[]) : [],
          dimension_scores: data.dimension_scores as SimulationSession['dimension_scores']
        });
      } else {
        // Use mock data if not found
        setSession(mockSession);
      }
      setLoading(false);
    };
    fetchSession();
  }, [user, sessionId]);

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

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-primary";
    return "text-destructive";
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-primary";
    return "bg-destructive";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">未找到训练记录</p>
          <Button className="mt-4" onClick={() => navigate("/history")}>
            返回历史记录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/history")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{session.scenario}</h1>
              <Badge variant="secondary">{session.brand}</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Clock className="h-4 w-4" />
              {formatDate(session.created_at)}
              <span>·</span>
              <span>{session.persona}</span>
            </div>
          </div>
        </div>
        <div className={`text-4xl font-bold ${getScoreColor(session.overall_score || 0)}`}>
          {session.overall_score}
          <span className="text-lg text-muted-foreground font-normal ml-1">分</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 对话记录 */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              对话记录
            </CardTitle>
            <CardDescription>完整对话内容与 AI 评价批注</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {session.messages && session.messages.length > 0 ? (
                  session.messages.map((msg, index) => (
                    <div key={index} className="space-y-2">
                      <div className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === "user" ? "bg-primary" : "bg-muted"
                        }`}>
                          {msg.role === "user" ? (
                            <User className="h-5 w-5 text-primary-foreground" />
                          ) : (
                            <Bot className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className={`flex-1 max-w-[75%] ${msg.role === "user" ? "text-right" : ""}`}>
                          <div className={`inline-block p-4 rounded-2xl ${
                            msg.role === "user" 
                              ? "bg-primary text-primary-foreground rounded-tr-md" 
                              : "bg-muted rounded-tl-md"
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                          {msg.timestamp && (
                            <p className="text-xs text-muted-foreground mt-1.5">{msg.timestamp}</p>
                          )}
                        </div>
                      </div>
                      {msg.annotation && (
                        <div className={`flex ${msg.role === "user" ? "justify-end mr-13" : "ml-13"}`}>
                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-[75%]">
                            <div className="flex items-center gap-2 text-xs text-primary mb-1.5">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span className="font-medium">AI 评价批注</span>
                            </div>
                            <p className="text-sm leading-relaxed">{msg.annotation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>暂无对话记录</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 评分与评价 */}
        <div className="space-y-6">
          {/* 维度评分 */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                维度评分
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.dimension_scores && Object.entries(session.dimension_scores).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{dimensionLabels[key] || key}</span>
                    <span className={`font-bold ${getScoreColor(value || 0)}`}>{value}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getProgressColor(value || 0)}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI 总结 */}
          {session.feedback && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI 教练总结
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {session.feedback}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryDetail;
