"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/use-locale";
import { Loader2 } from "lucide-react";

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface OrganizationMembersPanelProps {
  className?: string;
}

export function OrganizationMembersPanel({ className }: OrganizationMembersPanelProps) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/organization/members");
        if (!res.ok) return;
        const data = await res.json();
        setOrgName(data.organization?.name ?? null);
        setMembers(data.members ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card className={className}>
      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium">{t("Team Members", "团队成员")}</h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            {t(
              "Organization members who can access projects in this workspace.",
              "可访问本工作区项目的组织成员。"
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("Loading members…", "加载成员…")}
          </div>
        ) : members.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("No members found.", "暂无成员。")}
          </p>
        ) : (
          <div className="space-y-2">
            {orgName && (
              <p className="text-xs text-muted-foreground">
                {t("Organization", "组织")}: <span className="text-foreground font-medium">{orgName}</span>
              </p>
            )}
            <ul className="divide-y rounded-md border">
              {members.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <p className="text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {member.role}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          {t(
            "Invite and role management coming in a future release. Contact your admin to add colleagues.",
            "邀请与角色管理将在后续版本提供，如需添加同事请联系管理员。"
          )}
        </p>
      </CardContent>
    </Card>
  );
}
