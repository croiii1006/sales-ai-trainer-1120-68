import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, ChevronRight, MessageSquare, TrendingUp, FileText } from "lucide-react";

const HistoryCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="shadow-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">历史记录</h3>
              <p className="text-sm text-muted-foreground">
                查看完整的实战模拟记录与对话详情
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/history")} className="gap-2">
            查看全部
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 border-t divide-x">
          <div className="p-4 text-center">
            <MessageSquare className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">对话记录</p>
            <p className="text-xs text-muted-foreground">完整对话文档</p>
          </div>
          <div className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">趋势对比</p>
            <p className="text-xs text-muted-foreground">能力变化追踪</p>
          </div>
          <div className="p-4 text-center">
            <FileText className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">评价批注</p>
            <p className="text-xs text-muted-foreground">AI智能点评</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoryCard;
