import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

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

interface HistoryDialogProps {
  sessions: SimulationSession[];
  trigger?: React.ReactNode;
}

const dimensionLabels: Record<string, string> = {
  needsDiscovery: "需求挖掘",
  productKnowledge: "产品知识",
  objectionHandling: "异议处理",
  emotionalConnection: "情绪连接",
  closingSkill: "成交引导"
};

const HistoryDialog = ({ sessions, trigger }: HistoryDialogProps) => {
  const getTrendIcon = (current: number, previous: number | undefined) => {
    if (previous === undefined) return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 dark:text-green-500";
    if (score >= 70) return "text-primary";
    return "text-destructive";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1.5">
            <History className="h-4 w-4" />
            查看历史记录
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            实战历史记录
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {sessions.map((session, index) => {
              const previousSession = sessions[index + 1];
              const scoreDiff = previousSession?.overall_score 
                ? (session.overall_score || 0) - previousSession.overall_score 
                : 0;
              
              return (
                <div 
                  key={session.id} 
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(session.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${getScoreColor(session.overall_score || 0)}`}>
                        {session.overall_score}
                      </span>
                      <span className="text-sm text-muted-foreground">分</span>
                      {getTrendIcon(session.overall_score || 0, previousSession?.overall_score ?? undefined)}
                      {scoreDiff !== 0 && (
                        <Badge 
                          variant="secondary" 
                          className={scoreDiff > 0 ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}
                        >
                          {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {session.dimension_scores && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(session.dimension_scores).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {dimensionLabels[key] || key}: {value}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {session.feedback && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {session.feedback}
                    </p>
                  )}
                </div>
              );
            })}
            
            {sessions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                暂无历史记录
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HistoryDialog;
