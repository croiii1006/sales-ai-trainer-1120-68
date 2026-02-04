import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, MessageCircle } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("请输入有效的邮箱地址");
const passwordSchema = z.string().min(6, "密码至少需要6个字符");

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// WeChat icon component
const WeChatIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#07C160">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.025-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
  </svg>
);

// QR Code placeholder component
const QRCodePlaceholder = () => (
  <div className="w-36 h-36 bg-white p-2 rounded-lg">
    <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-0.5">
      {/* Generate a fake QR pattern */}
      {Array.from({ length: 49 }).map((_, i) => {
        const row = Math.floor(i / 7);
        const col = i % 7;
        // Corner patterns
        const isCorner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
        const isRandom = Math.random() > 0.5;
        return (
          <div
            key={i}
            className={`${isCorner || isRandom ? 'bg-foreground' : 'bg-transparent'} rounded-[1px]`}
          />
        );
      })}
    </div>
  </div>
);

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

  const handleSocialLogin = (provider: string) => {
    toast({
      title: "即将上线",
      description: `${provider}登录功能即将上线`,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="mb-12">
          <h1 className="text-xl font-bold text-foreground">销售培训系统</h1>
        </div>

        {/* Main Content - No border card */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          {/* Left - Form */}
          <div className="space-y-8">
            <p className="text-muted-foreground text-sm">
              {isLoginMode ? "输入您的账户信息登录系统" : "创建新账户开始学习之旅"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <Input
                  type="text"
                  placeholder="您的姓名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl border-0 bg-muted/50 placeholder:text-muted-foreground/60"
                  required={!isLoginMode}
                />
              )}

              <Input
                type="email"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-0 bg-muted/50 placeholder:text-muted-foreground/60"
                required
              />

              <Input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-0 bg-muted/50 placeholder:text-muted-foreground/60"
                required
              />

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLoginMode ? "登录中..." : "注册中..."}
                  </>
                ) : (
                  isLoginMode ? "继续" : "创建账户"
                )}
              </Button>
            </form>

            {/* Social Login */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">或使用以下方式继续</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="flex justify-center gap-8">
                <button
                  type="button"
                  onClick={() => handleSocialLogin("邮箱")}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">邮箱</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin("Google")}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <GoogleIcon />
                  </div>
                  <span className="text-xs text-muted-foreground">Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin("微信")}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <WeChatIcon />
                  </div>
                  <span className="text-xs text-muted-foreground">微信</span>
                </button>
              </div>
            </div>

            {/* Switch mode */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {isLoginMode ? "还没有账户？" : "已有账户？"}
              </p>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-border"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setName("");
                }}
              >
                {isLoginMode ? "创建账户" : "返回登录"}
              </Button>
            </div>
          </div>

          {/* Right - QR Code */}
          <div className="hidden md:flex flex-col items-center justify-center space-y-4">
            <QRCodePlaceholder />
            <div className="text-center">
              <h3 className="font-medium text-foreground">扫码登录</h3>
              <p className="text-xs text-muted-foreground mt-1">
                使用手机扫描二维码快速登录
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2024 销售培训系统</span>
          <span>隐私政策</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;