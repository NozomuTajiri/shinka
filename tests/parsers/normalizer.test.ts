/**
 * 正規化モジュールのテスト
 */

import { describe, it, expect } from 'vitest';
import {
  parseAmount,
  toYen,
  normalizeAccountName,
  cleanText,
  parseDate,
  getIndustryName,
} from '../../src/parsers/normalizer.js';

describe('parseAmount', () => {
  it('円単位の金額をパース', () => {
    const amount = parseAmount('1,234,567円');
    expect(amount.value).toBe(1234567);
    expect(amount.unit).toBe('円');
  });

  it('千円単位の金額をパース', () => {
    const amount = parseAmount('1,234千円');
    expect(amount.value).toBe(1234);
    expect(amount.unit).toBe('千円');
  });

  it('百万円単位の金額をパース', () => {
    const amount = parseAmount('123百万円');
    expect(amount.value).toBe(123);
    expect(amount.unit).toBe('百万円');
  });

  it('億円単位の金額をパース', () => {
    const amount = parseAmount('12億円');
    expect(amount.value).toBe(12);
    expect(amount.unit).toBe('億円');
  });

  it('マイナス金額をパース', () => {
    const amount = parseAmount('-1,234円');
    expect(amount.value).toBe(-1234);
    expect(amount.unit).toBe('円');
  });

  it('括弧表記（マイナス）をパース', () => {
    const amount = parseAmount('(1,234)円');
    expect(amount.value).toBe(-1234);
    expect(amount.unit).toBe('円');
  });

  it('全角数字をパース', () => {
    const amount = parseAmount('１,２３４円');
    expect(amount.value).toBe(1234);
    expect(amount.unit).toBe('円');
  });
});

describe('toYen', () => {
  it('円単位を変換', () => {
    const yen = toYen({ value: 1000, unit: '円' });
    expect(yen).toBe(1000);
  });

  it('千円単位を円に変換', () => {
    const yen = toYen({ value: 100, unit: '千円' });
    expect(yen).toBe(100_000);
  });

  it('百万円単位を円に変換', () => {
    const yen = toYen({ value: 10, unit: '百万円' });
    expect(yen).toBe(10_000_000);
  });

  it('億円単位を円に変換', () => {
    const yen = toYen({ value: 5, unit: '億円' });
    expect(yen).toBe(500_000_000);
  });
});

describe('normalizeAccountName', () => {
  it('勘定科目名を正規化', () => {
    expect(normalizeAccountName('現金預金')).toBe('現金及び預金');
    expect(normalizeAccountName('売掛債権')).toBe('売掛金');
    expect(normalizeAccountName('販管費')).toBe('販売費及び一般管理費');
  });

  it('空白を除去', () => {
    expect(normalizeAccountName(' 現金及び預金 ')).toBe('現金及び預金');
    expect(normalizeAccountName('現金  及び  預金')).toBe('現金及び預金');
  });

  it('未マッピングの勘定科目はそのまま返す', () => {
    const result = normalizeAccountName('カスタム科目');
    expect(result).toBe('カスタム科目');
  });
});

describe('cleanText', () => {
  it('改行とタブを除去', () => {
    const text = cleanText('テスト\n改行\tタブ');
    expect(text).toBe('テスト 改行 タブ');
  });

  it('連続する空白を統合', () => {
    const text = cleanText('複数    空白');
    expect(text).toBe('複数 空白');
  });

  it('前後の空白を削除', () => {
    const text = cleanText('  前後空白  ');
    expect(text).toBe('前後空白');
  });
});

describe('parseDate', () => {
  it('YYYY年MM月DD日形式をパース', () => {
    const date = parseDate('2024年3月31日');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2); // 0-indexed
    expect(date.getDate()).toBe(31);
  });

  it('YYYY/MM/DD形式をパース', () => {
    const date = parseDate('2024/03/31');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(31);
  });

  it('YYYY-MM-DD形式をパース', () => {
    const date = parseDate('2024-03-31');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(31);
  });

  it('令和の和暦をパース', () => {
    const date = parseDate('令和6年3月31日');
    expect(date.getFullYear()).toBe(2024);
  });

  it('平成の和暦をパース', () => {
    const date = parseDate('平成31年4月1日');
    expect(date.getFullYear()).toBe(2019);
  });
});

describe('getIndustryName', () => {
  it('業種コードから業種名を取得', () => {
    expect(getIndustryName(4)).toBe('食料品');
    expect(getIndustryName(25)).toBe('情報・通信業');
    expect(getIndustryName(33)).toBe('サービス業');
  });

  it('不明なコードは「不明」を返す', () => {
    expect(getIndustryName(999)).toBe('不明');
  });
});
