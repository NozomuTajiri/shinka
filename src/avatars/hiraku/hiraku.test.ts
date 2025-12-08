/**
 * Test suite for Hiraku Avatar
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HirakuAvatar, HIRAKU_PERSONA, DIAGNOSIS_LAYERS } from './index.js';
import { matchAvatarsToIssues, getAvatarProfile } from './avatar-matching.js';
import { getDiagnosisLayer, getAllQuestions, getQuestionsByCategory } from './diagnosis-model.js';
import type { IdentifiedIssue, IssuePriorityMatrix } from './types.js';

describe('HirakuAvatar', () => {
  let hiraku: HirakuAvatar;

  beforeEach(() => {
    hiraku = new HirakuAvatar();
  });

  it('should have correct persona definition', () => {
    const persona = hiraku.getPersona();
    expect(persona.id).toBe('hiraku');
    expect(persona.name).toBe('ひらく');
    expect(persona.role).toBe('初期相談コンサルタント');
    expect(persona.values).toHaveLength(4);
    expect(persona.behaviorPrinciples).toHaveLength(4);
  });

  it('should start a new session', () => {
    const session = hiraku.startSession('client-123');
    expect(session.sessionId).toContain('hiraku-');
    expect(session.clientId).toBe('client-123');
    expect(session.currentLayer).toBe(1);
    expect(session.answers.size).toBe(0);
    expect(session.identifiedIssues).toHaveLength(0);
  });

  it('should retrieve session result', () => {
    const session = hiraku.startSession('client-456');
    const result = hiraku.getSessionResult(session.sessionId);
    expect(result).not.toBeNull();
    expect(result?.issues).toEqual([]);
    expect(result?.recommendations).toEqual([]);
  });

  it('should return null for non-existent session', () => {
    const result = hiraku.getSessionResult('non-existent-session-id');
    expect(result).toBeNull();
  });
});

describe('DIAGNOSIS_LAYERS', () => {
  it('should have 5 layers', () => {
    expect(DIAGNOSIS_LAYERS).toHaveLength(5);
  });

  it('should have correct layer structure', () => {
    const layer1 = DIAGNOSIS_LAYERS[0];
    expect(layer1.layer).toBe(1);
    expect(layer1.name).toBe('経営理念・ビジョン層');
    expect(layer1.questions).toHaveLength(3);
  });

  it('should get diagnosis layer by number', () => {
    const layer = getDiagnosisLayer(3);
    expect(layer?.layer).toBe(3);
    expect(layer?.name).toBe('組織・人材層');
  });

  it('should return undefined for invalid layer number', () => {
    const layer = getDiagnosisLayer(99);
    expect(layer).toBeUndefined();
  });

  it('should get all questions', () => {
    const questions = getAllQuestions();
    expect(questions).toHaveLength(15); // 5 layers * 3 questions each
  });

  it('should get questions by category', () => {
    const visionQuestions = getQuestionsByCategory('vision');
    expect(visionQuestions.length).toBeGreaterThan(0);
    expect(visionQuestions.every(q => q.category === 'vision')).toBe(true);
  });
});

describe('Avatar Matching', () => {
  it('should match avatars to issues', () => {
    const issues: IdentifiedIssue[] = [
      {
        id: 'issue-1',
        category: 'vision',
        description: 'ビジョンが不明確',
        priority: {
          urgency: 5,
          impact: 5,
          resourceRequired: 'high',
          recommendedAction: 'Test action',
        },
        relatedValues: ['ビジョン'],
      },
      {
        id: 'issue-2',
        category: 'customer',
        description: '顧客フィードバック不足',
        priority: {
          urgency: 3,
          impact: 4,
          resourceRequired: 'medium',
          recommendedAction: 'Test action',
        },
        relatedValues: ['顧客価値'],
      },
    ];

    const recommendations = matchAvatarsToIssues(issues);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].matchScore).toBeGreaterThan(0);
    expect(recommendations[0].avatarName).toBeTruthy();
  });

  it('should return empty array for no matching issues', () => {
    const issues: IdentifiedIssue[] = [
      {
        id: 'issue-1',
        category: 'unknown-category',
        description: 'Unknown issue',
        priority: {
          urgency: 1,
          impact: 1,
          resourceRequired: 'low',
          recommendedAction: 'Test action',
        },
        relatedValues: [],
      },
    ];

    const recommendations = matchAvatarsToIssues(issues);
    expect(recommendations).toHaveLength(0);
  });

  it('should get avatar profile by id', () => {
    const profile = getAvatarProfile('senryaku');
    expect(profile?.name).toBe('SENRYAKU');
    expect(profile?.japaneseName).toBe('戦略');
  });

  it('should return undefined for unknown avatar id', () => {
    const profile = getAvatarProfile('unknown-avatar');
    expect(profile).toBeUndefined();
  });
});

describe('HIRAKU_PERSONA', () => {
  it('should export persona constant', () => {
    expect(HIRAKU_PERSONA.id).toBe('hiraku');
    expect(HIRAKU_PERSONA.communicationStyle.tone).toBe('温かく受容的');
  });
});
