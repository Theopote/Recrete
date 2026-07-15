import type { UserRole } from "@/types";

export type StakeholderParty =
  | "owner"
  | "design_team"
  | "structure_consultant"
  | "mep_consultant"
  | "heritage_authority"
  | "contractor"
  | "government";

export type ReviewStatus = "pending" | "in_review" | "approved" | "rejected" | "negotiating";

export type ReviewTargetType = "strategy" | "diagnosis" | "report" | "cost_estimate" | "spatial_plan";

export interface ProjectStakeholder {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  party: StakeholderParty;
  organization?: string | null;
  isLead: boolean;
  joinedAt: Date;
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  party: StakeholderParty;
  content: string;
  createdAt: Date;
}

export interface NegotiationPoint {
  id: string;
  reviewId: string;
  topic: string;
  positions: {
    party: StakeholderParty;
    stance: string;
    priority: "must_have" | "preferred" | "flexible";
  }[];
  status: "open" | "resolved" | "escalated";
  resolution?: string | null;
  updatedAt: Date;
}

export interface CollaborationReview {
  id: string;
  projectId: string;
  targetType: ReviewTargetType;
  targetId: string;
  targetTitle: string;
  status: ReviewStatus;
  requiredParties: StakeholderParty[];
  approvals: {
    party: StakeholderParty;
    approved: boolean;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    note?: string | null;
  }[];
  comments: ReviewComment[];
  negotiationPoints: NegotiationPoint[];
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborationSummary {
  stakeholders: ProjectStakeholder[];
  reviews: CollaborationReview[];
  pendingCount: number;
  negotiatingCount: number;
  approvedCount: number;
}
