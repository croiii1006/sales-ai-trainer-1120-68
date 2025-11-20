import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import type { EvaluationResult } from "@/lib/traeClient";

interface ResultPanelProps {
  persona: string;
  scenario: string;
  difficulty: string;
  evaluationResult: EvaluationResult | null;
  isActive: boolean;
}

const ResultPanel = ({
  persona,
  scenario,
  difficulty,
  evaluationResult,
  isActive,
}: ResultPanelProps) => {
  const checklistItems = [
    "挖掘需求",
    "明确预算 / 场景",
    "解释产品差异",
    "处理异议",
  ];

  const dimensionLabels = {
    needsDiscovery: "需求挖掘",
    productKnowledge: "产品知识",
    objectionHandling: "异议处理",
    emotionalConnection: "情绪沟通",
    closingSkill: "成交引导",
  };

  if (evaluationResult) {
    return (
      <Card className="h-full bg-card border-border shadow-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-semibold">评分结果</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Overall Score */}
          <div className="text-center space-y-2">
            <div className="text-6xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              {evaluationResult.overallScore}
            </div>
            <p className="text-sm text-muted-foreground">综合得分</p>
          </div>

          {/* Dimension Scores */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">维度评分</h4>
            {Object.entries(evaluationResult.dimensions).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {dimensionLabels[key as keyof typeof dimensionLabels]}
                  </span>
                  <span className="text-primary font-semibold">{value}</span>
                </div>
                <Progress
                  value={value}
                  className="h-2 bg-secondary"
                  indicatorClassName="bg-gradient-gold"
                />
              </div>
            ))}
          </div>

          {/* Feedback */}
          <div className="space-y-2 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground">改进建议</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {evaluationResult.feedback}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isActive) {
    return (
      <Card className="h-full bg-card border-border shadow-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-semibold">会话信息</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Session Config */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">顾客画像</span>
              <span className="text-foreground font-medium">{persona}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">销售场景</span>
              <span className="text-foreground font-medium">{scenario}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">难度等级</span>
              <span className="text-foreground font-medium">{difficulty}</span>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground">关键要点</h4>
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              完成对话后点击「结束并评分」查看详细评估结果
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card border-border shadow-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg font-semibold">会话信息</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            开始训练后，这里将显示会话信息和评分结果
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultPanel;
