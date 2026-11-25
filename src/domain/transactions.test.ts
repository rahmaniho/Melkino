import { describe, expect, it } from 'vitest';
import { mapCustomer, type CustomerView } from './customers';
import type { Property } from './properties';
import { createTransactionRecord, readTransactionRecords, updateTransactionRecord, validateTransactionDraft, writeTransactionRecords, type TransactionDraft, type TransactionRecord } from './transactions';

const customer=mapCustomer({id:'customer-1',branchId:'branch-1',code:'CU-1',fullName:'مشتری نمونه',phone:'09120000000',email:null,kind:'BUYER',targetTransaction:'SALE',preferredPropertyType:'APARTMENT',budgetMin:null,budgetMax:null,currency:'IRT',preferredArea:null,notes:null,status:'QUALIFIED',assignedTo:'agent-1',createdAt:'2026-01-01T00:00:00.000Z',archivedAt:null}) as CustomerView;
const property:Property={id:'property-1',branchId:'branch-1',code:'ML-1',title:'آپارتمان نمونه',area:'سعادت‌آباد',type:'آپارتمان',transaction:'SALE',size:120,beds:2,price:'۱۵ میلیارد',salePrice:'15000000000',currency:'تومان',image:'',status:'فعال',agent:'مشاور',date:'امروز'};
const draft:TransactionDraft={propertyId:'property-1',customerId:'customer-1',agreedAmount:'۱۲٬۰۰۰٬۰۰۰٬۰۰۰',currency:'IRT',stage:'VISIT',expectedCloseDate:'2026-12-01',notes:'بازدید اولیه'};
const record=(userId:string):TransactionRecord=>createTransactionRecord(draft,userId,[property],[customer],new Date('2026-11-22T10:00:00Z'),'deal-1');

describe('browser-local transaction pipeline',()=>{
 it('creates a validated transaction with a local stage history',()=>{const created=record('user-1');expect(created.agreedAmount).toBe('12000000000');expect(created.history).toEqual([{stage:'VISIT',changedAt:'2026-11-22T10:00:00.000Z'}])});
 it('requires an agreed amount before contract and closure',()=>{expect(()=>validateTransactionDraft({...draft,stage:'CONTRACT',agreedAmount:''},[property],[customer])).toThrow(/مبلغ توافق‌شده/);expect(()=>validateTransactionDraft({...draft,stage:'CLOSED',agreedAmount:'۱۰۰۰'},[property],[customer])).not.toThrow()});
 it('rejects archived records and cross-branch combinations',()=>{expect(()=>validateTransactionDraft(draft,[{...property,status:'بایگانی'}],[customer])).toThrow(/ملک فعال/);expect(()=>validateTransactionDraft(draft,[{...property,branchId:'branch-2'}],[customer])).toThrow(/یک شعبه/)});
 it('records stage transitions while preserving the initial timestamp',()=>{const original=record('user-1');const updated=updateTransactionRecord(original,{...draft,stage:'NEGOTIATION'},[property],[customer],new Date('2026-11-23T10:00:00Z'));expect(updated.history).toHaveLength(2);expect(updated.history[1].stage).toBe('NEGOTIATION');expect(updated.createdAt).toBe(original.createdAt)});
 it('keeps historical deals editable after a linked property is archived',()=>{const original=record('user-1');const archivedProperty={...property,status:'بایگانی'};const updated=updateTransactionRecord(original,{...draft,stage:'CONTRACT',agreedAmount:'۱۲٬۰۰۰٬۰۰۰٬۰۰۰'},[archivedProperty],[customer]);expect(updated.stage).toBe('CONTRACT')});
 it('scopes saved records to the current browser user and handles corrupt data',()=>{const stored=[record('user-1'),record('user-2')];let value='';const storage={getItem:()=>JSON.stringify(stored),setItem:(_key:string,next:string)=>{value=next}} as Pick<Storage,'getItem'|'setItem'>;expect(readTransactionRecords(storage,'key','user-1')).toHaveLength(1);writeTransactionRecords(storage,'key',stored);expect(JSON.parse(value)).toHaveLength(2);expect(readTransactionRecords({getItem:()=>'{'} as Pick<Storage,'getItem'>,'key','user-1')).toEqual([])});
});
