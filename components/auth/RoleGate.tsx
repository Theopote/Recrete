"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { ProjectAction } from "@/lib/auth/permissions";
import type { ProjectSection } from "@/types";

interface RoleGateProps {
  action?: ProjectAction;
  section?: ProjectSection;
  route?: string;
  /** Require any one of these actions */
  anyOf?: ProjectAction[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({
  action,
  section,
  route,
  anyOf,
  fallback = null,
  children,
}: RoleGateProps) {
  const { can, canAccessSection, canAccessRoute, isLoading } = usePermissions();

  if (isLoading) return null;

  let allowed = true;

  if (action) allowed = allowed && can(action);
  if (section) allowed = allowed && canAccessSection(section);
  if (route) allowed = allowed && canAccessRoute(route);
  if (anyOf?.length) allowed = allowed && anyOf.some((a) => can(a));

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
