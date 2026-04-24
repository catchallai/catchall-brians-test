export enum ReviewerApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHANGES_REQUESTED = 'changes_requested',
}

export interface ReviewerEntry {
  email: string;
  name: string;
  assigned_date?: string;
  status: ReviewerApprovalStatus;
  responded_date?: string;
}
