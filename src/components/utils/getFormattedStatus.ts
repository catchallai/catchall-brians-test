// TODO: Refactor this functionality throughout the codebase to use this utility instead of
// repeating the same formatting logic in multiple places
// Utility to format a post status string (e.g. 'pending_approval' => 'Pending Approval')
export function getFormattedStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
