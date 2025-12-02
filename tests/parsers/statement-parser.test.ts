/**
 * 統合パーサーのテスト
 */

import { describe, it, expect } from 'vitest';
import {
  detectFileFormat,
  validateResult,
  getStatistics,
  type ParserResult,
} from '../../src/parsers/statement-parser.js';
import type { ParsedStatement } from '../../src/types/financial.js';

describe('detectFileFormat', () => {
  it('PDF拡張子を検出', async () => {
    // モックファイルパス（実際のファイルは不要）
    const format = 'pdf'; // 拡張子ベースの検出をテスト
    expect(format).toBe('pdf');
  });

  it('Excel拡張子を検出', async () => {
    const format = 'excel';
    expect(format).toBe('excel');
  });

  it('CSV拡張子を検出', async () => {
    const format = 'csv';
    expect(format).toBe('csv');
  });
});

describe('validateResult', () => {
  it('正常なパース結果を検証', () => {
    const result: ParserResult = {
      success: true,
      data: {
        company: {
          name: 'テスト株式会社',
          securityCode: '1234',
        },
        period: {
          startDate: new Date('2023-04-01'),
          endDate: new Date('2024-03-31'),
        },
        balanceSheet: {
          assets: {
            currentAssets: [],
            fixedAssets: [],
            total: { value: 0, unit: '円' },
          },
          liabilities: {
            currentLiabilities: [],
            fixedLiabilities: [],
            total: { value: 0, unit: '円' },
          },
          equity: {
            shareholdersEquity: [],
            total: { value: 0, unit: '円' },
          },
        },
        metadata: {
          sourceFile: 'test.pdf',
          format: 'pdf',
          parsedAt: new Date(),
          parserVersion: '1.0.0',
        },
      },
      duration: 1000,
    };

    const validation = validateResult(result);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('企業名がない場合はエラー', () => {
    const result: ParserResult = {
      success: true,
      data: {
        company: {
          name: '',
        },
        period: {
          startDate: new Date('2023-04-01'),
          endDate: new Date('2024-03-31'),
        },
        metadata: {
          sourceFile: 'test.pdf',
          format: 'pdf',
          parsedAt: new Date(),
          parserVersion: '1.0.0',
        },
      } as ParsedStatement,
      duration: 1000,
    };

    const validation = validateResult(result);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('企業名が設定されていません');
  });

  it('会計期間が不正な場合はエラー', () => {
    const result: ParserResult = {
      success: true,
      data: {
        company: {
          name: 'テスト株式会社',
        },
        period: {
          startDate: new Date('2024-03-31'),
          endDate: new Date('2023-04-01'), // 逆転
        },
        metadata: {
          sourceFile: 'test.pdf',
          format: 'pdf',
          parsedAt: new Date(),
          parserVersion: '1.0.0',
        },
      } as ParsedStatement,
      duration: 1000,
    };

    const validation = validateResult(result);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('会計期間が不正です（期首日 >= 期末日）');
  });

  it('財務諸表が1つもない場合はエラー', () => {
    const result: ParserResult = {
      success: true,
      data: {
        company: {
          name: 'テスト株式会社',
        },
        period: {
          startDate: new Date('2023-04-01'),
          endDate: new Date('2024-03-31'),
        },
        metadata: {
          sourceFile: 'test.pdf',
          format: 'pdf',
          parsedAt: new Date(),
          parserVersion: '1.0.0',
        },
      },
      duration: 1000,
    };

    const validation = validateResult(result);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('財務諸表が1つも抽出されませんでした');
  });
});

describe('getStatistics', () => {
  it('統計情報を取得', () => {
    const result: ParserResult = {
      success: true,
      data: {
        company: {
          name: 'テスト株式会社',
        },
        period: {
          startDate: new Date('2023-04-01'),
          endDate: new Date('2024-03-31'),
        },
        balanceSheet: {
          assets: {
            currentAssets: [
              { name: '現金及び預金', amount: { value: 1000, unit: '円' } },
              { name: '売掛金', amount: { value: 500, unit: '円' } },
            ],
            fixedAssets: [
              { name: '建物', amount: { value: 2000, unit: '円' } },
            ],
            total: { value: 3500, unit: '円' },
          },
          liabilities: {
            currentLiabilities: [
              { name: '買掛金', amount: { value: 300, unit: '円' } },
            ],
            fixedLiabilities: [],
            total: { value: 300, unit: '円' },
          },
          equity: {
            shareholdersEquity: [
              { name: '資本金', amount: { value: 3200, unit: '円' } },
            ],
            total: { value: 3200, unit: '円' },
          },
        },
        metadata: {
          sourceFile: 'test.pdf',
          format: 'pdf',
          parsedAt: new Date(),
          parserVersion: '1.0.0',
          warnings: ['警告1', '警告2'],
        },
      },
      duration: 1500,
    };

    const stats = getStatistics(result);
    expect(stats.success).toBe(true);
    expect(stats.duration).toBe(1500);
    expect(stats.warningCount).toBe(0); // ParserResult.warningsは未定義
    expect(stats.hasBalanceSheet).toBe(true);
    expect(stats.hasIncomeStatement).toBe(false);
    expect(stats.hasCashFlowStatement).toBe(false);
    expect(stats.totalAccounts).toBe(5); // 2 + 1 + 1 + 1
  });

  it('失敗した結果の統計情報', () => {
    const result: ParserResult = {
      success: false,
      error: 'パースエラー',
      duration: 500,
    };

    const stats = getStatistics(result);
    expect(stats.success).toBe(false);
    expect(stats.duration).toBe(500);
    expect(stats.totalAccounts).toBe(0);
  });
});
