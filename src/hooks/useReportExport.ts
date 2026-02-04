import { useState } from "react";
import { toast } from "sonner";

interface DimensionData {
  dimension: string;
  score: number;
}

interface ExportData {
  avgScore: number;
  sessionCount: number;
  recentTrend: number;
  radarData: DimensionData[];
  strengths: DimensionData[];
  weaknesses: DimensionData[];
  feedback?: string;
}

export const useReportExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const generateHTMLContent = (data: ExportData) => {
    const { avgScore, sessionCount, recentTrend, radarData, strengths, weaknesses, feedback } = data;
    
    const dateStr = new Date().toLocaleDateString('zh-CN');
    const dateTimeStr = new Date().toLocaleString('zh-CN');
    const trendText = recentTrend > 0 ? `+${recentTrend}` : String(recentTrend);
    
    const dimensionsHtml = radarData.map(d => `
      <div class="dimension-item">
        <span class="dimension-name">${d.dimension}</span>
        <span class="dimension-score">${d.score} 分</span>
      </div>
    `).join('');
    
    const strengthsHtml = strengths.map(s => `
      <div class="dimension-item strength">
        <span class="dimension-name">${s.dimension}</span>
        <span class="dimension-score">${s.score} 分</span>
      </div>
    `).join('');
    
    const weaknessesHtml = weaknesses.map(w => `
      <div class="dimension-item weakness">
        <span class="dimension-name">${w.dimension}</span>
        <span class="dimension-score">${w.score} 分</span>
      </div>
    `).join('');
    
    const feedbackSection = feedback ? `
    <div class="card">
      <div class="card-title">💡 AI 教练建议</div>
      <div class="feedback">${feedback}</div>
    </div>
    ` : '';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>能力报告 - ${new Date().toLocaleDateString('zh-CN')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { color: #666; }
    .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .card-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .stat-item { text-align: center; }
    .stat-value { font-size: 32px; font-weight: 700; color: #3b82f6; }
    .stat-label { font-size: 14px; color: #666; margin-top: 4px; }
    .dimension-list { display: flex; flex-direction: column; gap: 12px; }
    .dimension-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 8px; }
    .dimension-name { font-weight: 500; }
    .dimension-score { font-weight: 600; color: #3b82f6; }
    .strength { border-left: 3px solid #22c55e; }
    .weakness { border-left: 3px solid #f97316; }
    .feedback { background: #f0f9ff; border-left: 3px solid #3b82f6; padding: 16px; border-radius: 8px; }
    .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
    @media print { body { background: white; } .container { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>销售能力分析报告</h1>
      <p>生成时间：${new Date().toLocaleString('zh-CN')}</p>
    </div>
    
    <div class="card">
      <div class="card-title">📊 综合概览</div>
      <div class="stats-grid">
        <div class="stat-item">
        <div class="stat-value">${avgScore}</div>
          <div class="stat-label">平均得分</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${trendText}</div>
          <div class="stat-label">最近趋势</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${sessionCount}</div>
          <div class="stat-label">模拟次数</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">📈 各维度得分</div>
      <div class="dimension-list">
        ${dimensionsHtml}
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">🏆 优势能力</div>
      <div class="dimension-list">
        ${strengthsHtml}
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">🎯 待提升能力</div>
      <div class="dimension-list">
        ${weaknessesHtml}
      </div>
    </div>
    
    ${feedbackSection}
    
    <div class="footer">
      此报告由 AI 销售培训系统自动生成
    </div>
  </div>
</body>
</html>
    `;
  };

  const exportReport = async (format: 'html' | 'pdf', data: ExportData) => {
    setIsExporting(true);
    
    try {
      const htmlContent = generateHTMLContent(data);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const fileName = `能力报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}`;
      
      if (format === 'html') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("HTML 报告已导出");
      } else {
        // For PDF, open in new window and trigger print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.onload = () => {
            printWindow.print();
          };
          toast.success("请在打印对话框中选择\"保存为 PDF\"");
        } else {
          toast.error("无法打开打印窗口，请检查浏览器弹窗设置");
        }
      }
    } catch (error) {
      toast.error("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  return { exportReport, isExporting };
};
