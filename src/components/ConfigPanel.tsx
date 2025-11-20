import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Play } from "lucide-react";

interface ConfigPanelProps {
  brand: string;
  persona: string;
  scenario: string;
  difficulty: string;
  onBrandChange: (value: string) => void;
  onPersonaChange: (value: string) => void;
  onScenarioChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onStart: () => void;
  onReset: () => void;
  disabled: boolean;
}

const ConfigPanel = ({
  brand,
  persona,
  scenario,
  difficulty,
  onBrandChange,
  onPersonaChange,
  onScenarioChange,
  onDifficultyChange,
  onStart,
  onReset,
  disabled,
}: ConfigPanelProps) => {
  return (
    <Card className="h-full bg-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">训练配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="brand" className="text-sm font-medium">
            品牌 Brand
          </Label>
          <Select value={brand} onValueChange={onBrandChange} disabled={disabled}>
            <SelectTrigger id="brand" className="bg-secondary border-border">
              <SelectValue placeholder="请选择训练品牌" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="Gucci">Gucci</SelectItem>
              <SelectItem value="Balenciaga">Balenciaga</SelectItem>
              <SelectItem value="Saint Laurent">Saint Laurent</SelectItem>
              <SelectItem value="Bottega Veneta">Bottega Veneta</SelectItem>
              <SelectItem value="Alexander McQueen">Alexander McQueen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="persona" className="text-sm font-medium">
            顾客画像
          </Label>
          <Select value={persona} onValueChange={onPersonaChange} disabled={disabled}>
            <SelectTrigger id="persona" className="bg-secondary border-border">
              <SelectValue placeholder="选择顾客类型" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="高净值顾客">高净值顾客</SelectItem>
              <SelectItem value="旅游客">旅游客</SelectItem>
              <SelectItem value="犹豫型顾客">犹豫型顾客</SelectItem>
              <SelectItem value="礼物购买者">礼物购买者</SelectItem>
              <SelectItem value="价格敏感型顾客">价格敏感型顾客</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scenario" className="text-sm font-medium">
            销售场景
          </Label>
          <Select value={scenario} onValueChange={onScenarioChange} disabled={disabled}>
            <SelectTrigger id="scenario" className="bg-secondary border-border">
              <SelectValue placeholder="选择场景" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="首次进店">首次进店</SelectItem>
              <SelectItem value="VIP 回访">VIP 回访</SelectItem>
              <SelectItem value="购买送老板的礼物">购买送老板的礼物</SelectItem>
              <SelectItem value="机场免税店场景">机场免税店场景</SelectItem>
              <SelectItem value="线上咨询">线上咨询</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">难度等级</Label>
          <div className="grid grid-cols-3 gap-2">
            {["基础", "中级", "高级"].map((level) => (
              <Button
                key={level}
                variant={difficulty === level ? "default" : "outline"}
                size="sm"
                onClick={() => onDifficultyChange(level)}
                disabled={disabled}
                className="transition-all"
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-4 space-y-3 border-t border-border">
          <Button
            onClick={onStart}
            disabled={disabled || !brand || !persona || !scenario || !difficulty}
            className="w-full bg-gradient-gold hover:opacity-90 text-luxury-black font-semibold"
          >
            <Play className="w-4 h-4 mr-2" />
            开始训练
          </Button>
          <Button
            variant="ghost"
            onClick={onReset}
            disabled={disabled}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重置配置
          </Button>
        </div>

        <div className="pt-4 text-xs text-muted-foreground border-t border-border">
          <p>当前为 Demo 演示版，AI 逻辑将在下一版本接入 Trae。</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigPanel;
