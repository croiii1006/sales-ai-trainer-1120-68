import { Button } from "@/components/ui/button";
import { Download, FileText, FileCode } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportReportBarProps {
  onExport: (format: 'html' | 'pdf') => void;
  isExporting?: boolean;
}

const ExportReportBar = ({ onExport, isExporting }: ExportReportBarProps) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card mb-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium">导出能力报告</h3>
          <p className="text-sm text-muted-foreground">生成完整的能力分析报告</p>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "导出中..." : "导出报告"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onExport('html')}>
            <FileCode className="h-4 w-4 mr-2" />
            导出为 HTML
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            导出为 PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ExportReportBar;
