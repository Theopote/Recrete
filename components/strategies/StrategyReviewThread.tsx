"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/use-locale";
import { MessageSquare, Send } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface StrategyReviewComment {
  id: string;
  authorName: string;
  content: string;
  riskTag?: string | null;
  mentionedUserIds: string[];
  createdAt: string;
}

interface StrategyReviewThreadProps {
  projectId: string;
  strategyId: string;
  riskOptions?: string[];
}

export function StrategyReviewThread({
  projectId,
  strategyId,
  riskOptions = [],
}: StrategyReviewThreadProps) {
  const { t } = useLocale();
  const [comments, setComments] = useState<StrategyReviewComment[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [content, setContent] = useState("");
  const [riskTag, setRiskTag] = useState("");
  const [mentionId, setMentionId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const [commentsRes, teamRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/strategies/${strategyId}/comments`),
        fetch(`/api/projects/${projectId}/team`),
      ]);
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.comments ?? []);
      }
      if (teamRes.ok) {
        const data = await teamRes.json();
        setMembers(data.members ?? []);
      }
    })();
  }, [projectId, strategyId]);

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      let finalContent = content.trim();
      const mentionedUserIds: string[] = [];

      if (mentionId) {
        const member = members.find((m) => m.id === mentionId);
        if (member) {
          finalContent = `@${member.name} ${finalContent}`;
          mentionedUserIds.push(member.id);
        }
      }

      const res = await fetch(
        `/api/projects/${projectId}/strategies/${strategyId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: finalContent,
            riskTag: riskTag || null,
            mentionedUserIds,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setContent("");
        setRiskTag("");
        setMentionId("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        {t("Strategy review comments", "方案评审留言")}
      </div>

      {comments.length > 0 && (
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {comments.map((c) => (
            <li key={c.id} className="rounded bg-background/80 px-2 py-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{c.authorName}</span>
                {c.riskTag && (
                  <span className="text-[10px] text-amber-600 truncate max-w-[50%]">
                    {t("Linked", "关联")}：{c.riskTag}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {riskOptions.length > 0 && (
          <Select
            value={riskTag}
            onChange={(e) => setRiskTag(e.target.value)}
            className="h-8 w-44 text-xs"
          >
            <option value="">{t("Link risk (optional)", "关联风险点（可选）")}</option>
            {riskOptions.map((risk) => (
              <option key={risk} value={risk}>
                {risk.length > 28 ? `${risk.slice(0, 28)}…` : risk}
              </option>
            ))}
          </Select>
        )}
        {members.length > 0 && (
          <Select
            value={mentionId}
            onChange={(e) => setMentionId(e.target.value)}
            className="h-8 w-40 text-xs"
          >
            <option value="">{t("@ colleague (optional)", "@ 同事（可选）")}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t(
            "Structural, client, or design colleagues can discuss this strategy here…",
            "结构、甲方或设计同事可在此讨论本方案…"
          )}
          className="min-h-[56px] text-xs resize-none"
        />
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
