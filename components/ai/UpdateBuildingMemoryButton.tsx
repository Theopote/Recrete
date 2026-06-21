"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface UpdateBuildingMemoryButtonProps {
  projectId: string;
}

export function UpdateBuildingMemoryButton({ projectId }: UpdateBuildingMemoryButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/building-memory`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="copper" size="sm" onClick={handleUpdate} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
      )}
      Update Building Memory
    </Button>
  );
}
