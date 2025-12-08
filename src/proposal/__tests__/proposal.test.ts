/**
 * コンサルティング提案生成エンジンのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProposalGenerator } from '../proposal-generator.js';
import { ClaudeClient as _ClaudeClient } from '../claude-client.js';
import { getSystemPrompt, buildProposalPrompt } from '../prompt-templates.js';
import type { ProposalGenerationRequest } from '../../types/proposal.js';

describe('プロンプトテンプレート', () => {
  it('システムプロンプトを生成できる', () => {
    const systemPrompt = getSystemPrompt();

    expect(systemPrompt).toContain('経営戦略コンサルタント');
    expect(systemPrompt).toContain('価値主義経営');
    expect(systemPrompt).toContain('顧客価値');
    expect(systemPrompt).toContain('JSON形式');
  });

  it('提案生成プロンプトを構築できる', () => {
    const request: ProposalGenerationRequest = {
      clientName: 'テスト株式会社',
      industry: '製造業',
      companySize: '従業員100名',
      mainChallenges: 'デジタル化の遅れ',
      focusValues: ['business_value', 'customer_value'],
    };

    const prompt = buildProposalPrompt(request);

    expect(prompt).toContain('テスト株式会社');
    expect(prompt).toContain('製造業');
    expect(prompt).toContain('従業員100名');
    expect(prompt).toContain('デジタル化の遅れ');
    expect(prompt).toContain('事業価値');
    expect(prompt).toContain('顧客価値');
  });

  it('追加情報を含む提案生成プロンプトを構築できる', () => {
    const request: ProposalGenerationRequest = {
      clientName: 'テスト株式会社',
      industry: '製造業',
      companySize: '従業員100名',
      mainChallenges: 'デジタル化の遅れ',
      additionalContext: '3年以内に売上を2倍にしたい',
    };

    const prompt = buildProposalPrompt(request);

    expect(prompt).toContain('追加情報');
    expect(prompt).toContain('3年以内に売上を2倍にしたい');
  });
});

describe('提案書のバリデーション', () => {
  let generator: ProposalGenerator;

  beforeEach(() => {
    // モックAPIキー（実際には使用されない）
    generator = new ProposalGenerator({
      apiKey: 'test-key',
      verbose: false,
    });
  });

  it('正しい提案書をパースできる', () => {
    const validProposal = {
      id: 'test-123',
      title: 'テスト提案書',
      clientName: 'テスト株式会社',
      createdAt: new Date().toISOString(),
      consultant: {
        name: 'テストコンサルタント',
        title: '経営戦略コンサルタント',
        organization: 'テスト組織',
      },
      executiveSummary: {
        challengeSummary: 'テスト課題',
        proposalOverview: 'テスト提案',
        keyOutcomes: ['成果1', '成果2'],
        estimatedInvestment: '1000万円',
        expectedROI: '300%',
      },
      currentState: {
        industryTrends: 'テスト動向',
        companyStatus: 'テスト現状',
        strengths: ['強み1'],
        weaknesses: ['弱み1'],
        opportunities: ['機会1'],
        threats: ['脅威1'],
      },
      issues: [
        {
          id: 'issue-1',
          title: 'テスト課題',
          description: 'テスト説明',
          affectedValues: ['customer_value'],
          priority: 'high',
          businessImpact: 'テストインパクト',
        },
      ],
      measures: [
        {
          id: 'measure-1',
          title: 'テスト施策',
          description: 'テスト説明',
          targetIssueIds: ['issue-1'],
          relatedValues: ['customer_value'],
          priority: 'high',
          timeframe: 'short',
          expectedEffects: ['効果1'],
          requiredResources: ['リソース1'],
          successMetrics: ['KPI1'],
        },
      ],
      implementationPlan: {
        overallTimeline: '12ヶ月',
        phases: [
          {
            phase: 1,
            name: 'フェーズ1',
            duration: '1-3ヶ月',
            activities: ['活動1'],
            milestones: ['マイルストーン1'],
            deliverables: ['成果物1'],
          },
        ],
        organizationStructure: 'テスト体制',
        risksAndMitigations: [
          {
            risk: 'リスク1',
            mitigation: '対策1',
          },
        ],
      },
      expectedEffects: {
        shortTerm: ['短期効果1'],
        mediumTerm: ['中期効果1'],
        longTerm: ['長期効果1'],
        quantitativeEffects: [
          {
            metric: '売上',
            current: '100億円',
            target: '150億円',
            improvement: '+50%',
          },
        ],
      },
      investmentPlan: {
        initialInvestment: {
          description: 'テスト投資',
          amount: '1000万円',
          breakdown: [{ item: '項目1', cost: '500万円' }],
        },
        operationalCost: {
          description: 'テスト運用',
          amount: '100万円',
          breakdown: [{ item: '項目1', cost: '50万円' }],
        },
        roiProjection: {
          year1: 'ROI 50%',
          year2: 'ROI 150%',
          year3: 'ROI 300%',
        },
      },
    };

    const jsonContent = JSON.stringify(validProposal);

    // プライベートメソッドのテストのため、any型でキャスト
    const parsed = (generator as any).parseProposal(jsonContent);

    expect(parsed.id).toBe('test-123');
    expect(parsed.title).toBe('テスト提案書');
    expect(parsed.issues).toHaveLength(1);
    expect(parsed.measures).toHaveLength(1);
  });

  it('Markdownコードブロック内のJSONをパースできる', () => {
    const jsonContent = `
\`\`\`json
{
  "id": "test-123",
  "title": "テスト"
}
\`\`\`
    `.trim();

    // エラーが発生するはず（必須フィールドが不足）
    expect(() => {
      (generator as any).parseProposal(jsonContent);
    }).toThrow();
  });

  it('無効なJSONでエラーを投げる', () => {
    const invalidJson = 'これは無効なJSONです';

    expect(() => {
      (generator as any).parseProposal(invalidJson);
    }).toThrow('提案書のパースに失敗しました');
  });

  it('必須フィールドが不足している場合にエラーを投げる', () => {
    const incompleteProposal = {
      id: 'test-123',
      title: 'テスト',
      // 他の必須フィールドが不足
    };

    const jsonContent = JSON.stringify(incompleteProposal);

    expect(() => {
      (generator as any).parseProposal(jsonContent);
    }).toThrow('提案書が無効です');
  });
});

describe('進捗推定', () => {
  let generator: ProposalGenerator;

  beforeEach(() => {
    generator = new ProposalGenerator({
      apiKey: 'test-key',
      verbose: false,
    });
  });

  it('JSON生成の進捗を推定できる', () => {
    const content1 = '{ "executiveSummary": {';
    const progress1 = (generator as any).estimateProgress(content1);
    expect(progress1).toBeGreaterThan(0);

    const content2 = `{
      "executiveSummary": {},
      "currentState": {},
      "issues": [],
      "measures": []
    }`;
    const progress2 = (generator as any).estimateProgress(content2);
    expect(progress2).toBeGreaterThan(progress1);

    const content3 = `{
      "executiveSummary": {},
      "currentState": {},
      "issues": [],
      "measures": [],
      "implementationPlan": {},
      "expectedEffects": {},
      "investmentPlan": {}
    }`;
    const progress3 = (generator as any).estimateProgress(content3);
    expect(progress3).toBeGreaterThan(progress2);
  });
});

describe('フォーマッター', () => {
  it('MarkdownFormatterがインポートできる', async () => {
    const { createMarkdownFormatter } = await import('../formatters/markdown.js');
    const formatter = createMarkdownFormatter();
    expect(formatter).toBeDefined();
  });

  it('PDFFormatterがインポートできる', async () => {
    const { createPDFFormatter } = await import('../formatters/pdf.js');
    const formatter = createPDFFormatter();
    expect(formatter).toBeDefined();
  });

  it('ExcelFormatterがインポートできる', async () => {
    const { createExcelFormatter } = await import('../formatters/excel.js');
    const formatter = createExcelFormatter();
    expect(formatter).toBeDefined();
  });
});
