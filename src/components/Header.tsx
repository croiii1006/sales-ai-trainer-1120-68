import { Sparkles } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-luxury-black border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-luxury-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-gold bg-clip-text text-transparent">
                AI 销售训练 Lite
              </h1>
              <p className="text-xs text-muted-foreground">
                AI 顾客对话模拟 · 销售场景训练
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground border border-border px-4 py-2 rounded-lg">
            Demo 版本 – 支持 Trae 集成
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
