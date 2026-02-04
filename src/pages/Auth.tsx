import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("请输入有效的邮箱地址");
const passwordSchema = z.string().min(6, "密码至少需要6个字符");

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!isLoginMode && !name.trim()) {
        throw new Error("请输入姓名");
      }
    } catch (error) {
      toast({
        title: "验证失败",
        description: error instanceof z.ZodError ? error.errors[0].message : (error as Error).message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    if (isLoginMode) {
      const { error } = await signIn(email, password);
      setIsLoading(false);
      if (error) {
        toast({
          title: "登录失败",
          description: error.message === "Invalid login credentials" ? "邮箱或密码错误" : error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "登录成功", description: "欢迎回来！" });
        navigate("/");
      }
    } else {
      const { error } = await signUp(email, password, name);
      setIsLoading(false);
      if (error) {
        const errorMessage = error.message.includes("already registered")
          ? "该邮箱已注册，请直接登录"
          : error.message;
        toast({ title: "注册失败", description: errorMessage, variant: "destructive" });
      } else {
        toast({ title: "注册成功", description: "欢迎加入培训系统！" });
        navigate("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-foreground">销售培训系统</h1>
        </div>

        {/* Main Card */}
        <div className="bg-card rounded-3xl shadow-lg border border-border overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left - Form */}
            <div className="p-8 md:p-12">
              <div className="mb-8">
                <p className="text-muted-foreground text-sm">
                  {isLoginMode ? "输入您的账户信息登录系统" : "创建新账户开始学习之旅"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLoginMode && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs text-muted-foreground uppercase tracking-wider">
                      姓名
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="您的姓名"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-border bg-background"
                        required={!isLoginMode}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider">
                    邮箱
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-border bg-background"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider">
                    密码
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-border bg-background"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-medium bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLoginMode ? "登录中..." : "注册中..."}
                    </>
                  ) : (
                    <>
                      {isLoginMode ? "继续" : "创建账户"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {isLoginMode ? "还没有账户？" : "已有账户？"}
                </p>
                <Button
                  variant="ghost"
                  className="mt-2 text-primary hover:text-primary/80 font-medium"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setName("");
                  }}
                >
                  {isLoginMode ? "创建账户" : "返回登录"}
                </Button>
              </div>
            </div>

            {/* Right - Decorative */}
            <div className="hidden md:flex items-center justify-center bg-muted/50 p-12">
              <div className="text-center space-y-6">
                <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="text-5xl">🎓</div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    AI 驱动培训
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                    通过智能模拟对话，提升您的奢侈品销售技能
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2024 销售培训系统</span>
          <span>隐私政策</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;