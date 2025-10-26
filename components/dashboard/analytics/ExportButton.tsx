"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  onExport?: () => void;
}

export function ExportButton({ onExport }: ExportButtonProps) {
  return (
    <Button variant="outline" onClick={onExport}>
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  );
}
