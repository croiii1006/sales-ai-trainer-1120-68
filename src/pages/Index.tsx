import { useState } from "react";
import Header from "@/components/Header";
import ConfigPanel from "@/components/ConfigPanel";
import ChatPanel from "@/components/ChatPanel";
import ResultPanel from "@/components/ResultPanel";
import { useToast } from "@/hooks/use-toast";
import {
  startSessionWithTrae,
  sendMessageToTrae,
  evaluateSessionWithTrae,
  type ChatMessage,
  type EvaluationResult,
  type SessionConfig,
  PERSONA_MAP,
  SCENARIO_MAP,
  DIFFICULTY_MAP,
} from "@/lib/traeClient";

const Index = () => {
  const { toast } = useToast();

  // Configuration state
  const [brand, setBrand] = useState("");
  const [persona, setPersona] = useState("");
  const [scenario, setScenario] = useState("");
  const [difficulty, setDifficulty] = useState("");

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // 保存人设和对话 prompt
  const [personaDetails, setPersonaDetails] = useState<string>("");
  const [dialoguePrompt, setDialoguePrompt] = useState<string>("");

  const handleStartSession = async () => {
    if (!brand || !persona || !scenario || !difficulty) {
      toast({
        title: "配置不完整",
        description: "请先完成所有配置项",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await startSessionWithTrae({
        brand: brand || "Gucci",
        persona: PERSONA_MAP[persona],
        scenario: SCENARIO_MAP[scenario],
        difficulty: DIFFICULTY_MAP[difficulty],
      });

      setSessionId(response.sessionId);
      // 保存配置，用于后续评分
      setSessionConfig({
        brand: brand || "Gucci",
        personaId: PERSONA_MAP[persona],
        scenarioId: SCENARIO_MAP[scenario],
        difficulty: DIFFICULTY_MAP[difficulty],
      });

      // 保存人设和对话 prompt
      setPersonaDetails(response.personaDetails);
      setDialoguePrompt(response.dialoguePrompt);

      setMessages([
        {
          role: "customer",
          text: response.firstMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsSessionActive(true);
      setEvaluationResult(null);

      toast({
        title: "训练开始",
        description: "AI 顾客已准备好，请开始对话",
      });
    } catch (error) {
      toast({
        title: "启动失败",
        description: "无法启动训练会话，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (userMessage: string) => {
    if (!sessionId) return;

    const userMsg: ChatMessage = {
      role: "user",
      text: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 构建对话历史（不包含当前用户消息）
      const conversationHistory = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await sendMessageToTrae({
        sessionId,
        userMessage,
        dialoguePrompt, // 传入包含人设的对话 prompt
        conversationHistory, // 传入对话历史
      });

      const customerMsg: ChatMessage = {
        role: "customer",
        text: response.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, customerMsg]);

      // 检查对话是否结束
      if (response.state === "PURCHASED" || response.state === "LEFT") {
        setIsLoading(false);
        // 自动结束会话并评分
        setTimeout(() => {
          handleEndSession();
        }, 1000);
        return;
      }
    } catch (error) {
      toast({
        title: "发送失败",
        description: "消息发送失败，请重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!sessionId || !sessionConfig) return;

    setIsLoading(true);
    try {
      const result = await evaluateSessionWithTrae({
        sessionId,
        messages,
      });

      setEvaluationResult(result);
      setIsSessionActive(false);

      toast({
        title: "评分完成",
        description: `您的综合得分为 ${result.overallScore} 分`,
      });
    } catch (error) {
      toast({
        title: "评分失败",
        description: "无法生成评分，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setBrand("");
    setPersona("");
    setScenario("");
    setDifficulty("");
    setSessionId(null);
    setSessionConfig(null);
    setIsSessionActive(false);
    setMessages([]);
    setEvaluationResult(null);
    setPersonaDetails("");
    setDialoguePrompt("");
    setIsLoading(false);

    toast({
      title: "已重置",
      description: "所有配置已清空",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 pt-24 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Panel - Config */}
          <div className="lg:col-span-3">
            <ConfigPanel
              brand={brand}
              persona={persona}
              scenario={scenario}
              difficulty={difficulty}
              onBrandChange={setBrand}
              onPersonaChange={setPersona}
              onScenarioChange={setScenario}
              onDifficultyChange={setDifficulty}
              onStart={handleStartSession}
              onReset={handleReset}
              disabled={isSessionActive || isLoading}
            />
          </div>

          {/* Center Panel - Chat */}
          <div className="lg:col-span-6">
            <ChatPanel
              persona={persona}
              scenario={scenario}
              messages={messages}
              isActive={isSessionActive}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onEndSession={handleEndSession}
            />
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-3">
            <ResultPanel
              persona={persona}
              scenario={scenario}
              difficulty={difficulty}
              evaluationResult={evaluationResult}
              isActive={isSessionActive}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
