import { describe, expect, it } from 'vitest';
import { mapFollowUp, type FollowUpRecord } from './follow-ups';

const record: FollowUpRecord = {
  id: '11111111-1111-4111-8111-111111111111', code: 'FU-123', title: 'پیگیری بازدید', details: null,
  kind: 'PROPERTY_VISIT', status: 'OPEN', dueAt: '2026-11-23T10:30:00.000Z', completedAt: null,
  customerId: '22222222-2222-4222-8222-222222222222', customerName: 'مریم رضایی', customerPhone: '09121234567',
  propertyId: null, propertyCode: null, propertyTitle: null, assignedTo: '33333333-3333-4333-8333-333333333333', createdAt: '2026-11-22T10:00:00.000Z',
};

describe('follow-up view adapter', () => {
  it('maps task type, status, Persian date and authenticated assignee', () => {
    expect(mapFollowUp(record, record.assignedTo, 'مشاور')).toMatchObject({ kindLabel: 'بازدید ملک', statusLabel: 'در انتظار', assignedLabel: 'مشاور' });
  });
});
