import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, StopCircle, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/traeClient";

interface ChatPanelProps {
  persona: string;
  scenario: string;
  messages: ChatMessage[];
  isActive: boolean;
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onEndSession: () => void;
}

const ChatPanel = ({
  persona,
  scenario,
  messages,
  isActive,
  isLoading,
  onSendMessage,
  onEndSession,
}: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-full bg-card border-border shadow-card flex flex-col">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">对话面板</CardTitle>
          {isActive && (
            <div className="flex gap-2">
              <Badge variant="outline" className="border-primary/50 text-primary">
                {persona}
              </Badge>
              <Badge variant="outline" className="border-primary/50 text-primary">
                {scenario}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!isActive && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  请先在左侧配置训练参数
                </p>
                <p className="text-muted-foreground text-xs">
                  然后点击「开始训练」开始对话
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-gradient-gold text-luxury-black"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === "user"
                          ? "text-luxury-black/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-foreground rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI 顾客正在思考...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        {isActive && (
          <div className="border-t border-border p-4 space-y-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请以销售顾问身份回复顾客..."
              className="min-h-[80px] resize-none bg-secondary border-border"
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex-1 bg-gradient-gold hover:opacity-90 text-luxury-black font-semibold"
              >
                <Send className="w-4 h-4 mr-2" />
                发送
              </Button>
              <Button
                variant="outline"
                onClick={onEndSession}
                disabled={isLoading}
                className="border-border"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                结束并评分
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatPanel;
