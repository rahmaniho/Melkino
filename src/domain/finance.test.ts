import { describe, expect, it } from 'vitest';
import { calculateCommission, parseCommissionRate, parseMoney, readCommissionRecords, type CommissionRecord } from './finance';

const record=(userId:string):CommissionRecord=>({id:'entry-1',userId,title:'کمیسیون',propertyId:null,customerId:null,transactionAmount:'15000000000',commissionRateBasisPoints:150,currency:'IRT',dueDate:null,status:'OPEN',createdAt:'2026-01-01T00:00:00.000Z'});

describe('local commission ledger calculations',()=>{
 it('parses Persian and Arabic-Indic amount digits without floating point',()=>{expect(parseMoney('۱٬۲۳۴٬۵۶۷')).toBe('1234567');expect(parseMoney('١٢٣٤')).toBe('1234')});
 it('parses commission percentages to basis points including Persian decimal separators',()=>{expect(parseCommissionRate('۱٫۵٪')).toBe(150);expect(parseCommissionRate('2.25')).toBe(225)});
 it('computes rounded commission with integer arithmetic',()=>{expect(calculateCommission('15000000000',150)).toBe('225000000');expect(calculateCommission('101',50)).toBe('1')});
 it('rejects malformed money and out-of-range commission rates',()=>{expect(()=>parseMoney('-100')).toThrow();expect(()=>parseCommissionRate('0')).toThrow();expect(()=>parseCommissionRate('100.01')).toThrow()});
 it('filters browser records to the current user and handles invalid storage safely',()=>{const storage={getItem:()=>JSON.stringify([record('u1'),record('u2'),{...record('u1'),id:'bad',commissionRateBasisPoints:10001}])} as Pick<Storage,'getItem'>;expect(readCommissionRecords(storage,'key','u1').map(item=>[item.id,item.transactionId])).toEqual([['entry-1',null]]);expect(readCommissionRecords({getItem:()=>'{'} as Pick<Storage,'getItem'>,'key','u1')).toEqual([])});
});
