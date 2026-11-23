export type FollowUpKind = 'CALL' | 'MEETING' | 'PROPERTY_VISIT' | 'REMINDER';
export type FollowUpStatus = 'OPEN' | 'DONE' | 'CANCELLED';
export type FollowUpRecord = {
  id: string;
  code: string;
  title: string;
  details: string | null;
  kind: FollowUpKind;
  status: FollowUpStatus;
  dueAt: string;
  completedAt: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string;
  propertyId: string | null;
  propertyCode: string | null;
  propertyTitle: string | null;
  assignedTo: string;
  createdAt: string;
};
export type FollowUpView = FollowUpRecord & { kindLabel: string; statusLabel: string; dueLabel: string; assignedLabel: string };

export function mapFollowUp(record: FollowUpRecord, currentUserId?: string, currentUserName?: string): FollowUpView {
  const kindLabels: Record<FollowUpKind, string> = { CALL: 'تماس', MEETING: 'جلسه', PROPERTY_VISIT: 'بازدید ملک', REMINDER: 'یادآوری' };
  const statusLabels: Record<FollowUpStatus, string> = { OPEN: 'در انتظار', DONE: 'انجام‌شده', CANCELLED: 'لغوشده' };
  const dueDate = new Date(record.dueAt);
  return {
    ...record,
    kindLabel: kindLabels[record.kind],
    statusLabel: statusLabels[record.status],
    dueLabel: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(dueDate),
    assignedLabel: record.assignedTo === currentUserId ? currentUserName || 'کاربر جاری' : 'مشاور تیم',
  };
}
