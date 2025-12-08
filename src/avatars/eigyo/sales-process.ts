/**
 * 科学的営業プロセスフレームワーク
 */

import type { SalesProcess, ObjectionHandling } from './types.js';

export const SALES_PROCESSES: SalesProcess[] = [
  {
    phase: 'approach',
    name: 'アプローチ',
    objectives: [
      '第一印象で信頼を獲得',
      '面談機会の創出',
      '初期の関係構築',
    ],
    keyActions: [
      '事前リサーチの徹底',
      'パーソナライズされたメッセージ',
      '価値を示唆するフック',
      'フォローアップの計画',
    ],
    successCriteria: [
      '返信率30%以上',
      '面談設定率15%以上',
      '好意的な反応の獲得',
    ],
  },
  {
    phase: 'discovery',
    name: 'ニーズ発見',
    objectives: [
      '表面ニーズの把握',
      '本質的課題の発見',
      '購買動機の理解',
    ],
    keyActions: [
      'オープンクエスチョンで深堀り',
      'アクティブリスニング',
      'ニーズビハインドニーズの探索',
      '課題の優先順位確認',
    ],
    successCriteria: [
      '3つ以上の課題特定',
      '意思決定基準の把握',
      'タイムラインの確認',
    ],
  },
  {
    phase: 'presentation',
    name: 'プレゼンテーション',
    objectives: [
      '価値提案の明確化',
      '差別化ポイントの訴求',
      '具体的な解決策の提示',
    ],
    keyActions: [
      '顧客課題に紐づけた提案',
      '事例・実績の活用',
      'ROIの具体的提示',
      'デモ・トライアルの提案',
    ],
    successCriteria: [
      '次のステップへの合意',
      '追加関係者の紹介',
      '具体的な検討開始',
    ],
  },
  {
    phase: 'handling',
    name: '反論対応',
    objectives: [
      '懸念点の解消',
      '信頼の深化',
      '前進の阻害要因除去',
    ],
    keyActions: [
      '反論を歓迎する姿勢',
      '共感と理解の表明',
      '論理的な反証',
      '第三者証言の活用',
    ],
    successCriteria: [
      '主要反論の解消',
      '追加検討の合意',
      '関係性の維持・向上',
    ],
  },
  {
    phase: 'closing',
    name: 'クロージング',
    objectives: [
      '合意の取り付け',
      '契約条件の確定',
      '導入計画の策定',
    ],
    keyActions: [
      'クロージングサインの把握',
      '適切なクロージング手法選択',
      '緊急性の創出',
      '意思決定支援',
    ],
    successCriteria: [
      '契約締結',
      '導入日程の確定',
      '関係者全員の合意',
    ],
  },
  {
    phase: 'follow',
    name: 'フォローアップ',
    objectives: [
      '顧客満足度の確保',
      '追加ニーズの発見',
      '紹介・リファラル獲得',
    ],
    keyActions: [
      '導入サポート',
      '定期的な価値確認',
      '成功事例化',
      'アップセル・クロスセル提案',
    ],
    successCriteria: [
      'NPS向上',
      '追加受注',
      '紹介獲得',
    ],
  },
];

export const OBJECTION_PATTERNS: ObjectionHandling[] = [
  {
    objectionType: 'price',
    objection: '高いですね',
    responseStrategy: '価値対費用のフレーミング',
    sampleResponse: 'ご予算のご懸念、よく理解できます。投資対効果という観点で、具体的な数字をお見せしてもよろしいでしょうか。',
    followUpQuestions: [
      '現在の課題によるコストはどの程度ですか？',
      '導入後の効果をどのように測定されますか？',
    ],
  },
  {
    objectionType: 'timing',
    objection: '今は時期ではない',
    responseStrategy: '先延ばしコストの可視化',
    sampleResponse: '今すぐでないというお気持ち、理解できます。ただ、3ヶ月後に始める場合と今始める場合の違いについて、少しお話しさせていただいてもよいでしょうか？',
    followUpQuestions: [
      '最適なタイミングとは、どのような状況ですか？',
      '現状を維持した場合のリスクはありますか？',
    ],
  },
  {
    objectionType: 'competitor',
    objection: '他社と比較検討中です',
    responseStrategy: '差別化ポイントの明確化',
    sampleResponse: 'しっかり比較検討されるのは賢明なご判断です。特に御社にとって重要な選定基準は何でしょうか？その点について詳しくご説明させてください。',
    followUpQuestions: [
      '他社のどの点を評価されていますか？',
      '最終的な判断基準は何ですか？',
    ],
  },
  {
    objectionType: 'authority',
    objection: '私には決定権がありません',
    responseStrategy: 'キーパーソンへのアクセス支援',
    sampleResponse: 'ご状況、理解いたしました。ご担当者様が上申される際に、私どもからサポートできることはございますか？資料作成など、お手伝いさせてください。',
    followUpQuestions: [
      '最終的な決裁者はどなたですか？',
      '上申の際にどのような情報が必要ですか？',
    ],
  },
  {
    objectionType: 'trust',
    objection: '実績が心配です',
    responseStrategy: '社会的証明の提示',
    sampleResponse: '初めてお取引いただく際のご不安は当然です。同業他社様の事例をご紹介させていただいてもよろしいでしょうか。また、トライアルというオプションもございます。',
    followUpQuestions: [
      'どのような実績があれば安心されますか？',
      '小規模な試験導入は検討可能ですか？',
    ],
  },
  {
    objectionType: 'need',
    objection: '今のままで問題ありません',
    responseStrategy: '潜在課題の可視化',
    sampleResponse: '現状でうまく回っていらっしゃるのですね。ただ、同業他社様では○○という課題を抱えていらっしゃることが多いのですが、御社ではいかがでしょうか？',
    followUpQuestions: [
      '3年後、5年後にはどのような状況を目指していますか？',
      '競合他社と比較して、改善の余地はありますか？',
    ],
  },
];

export function getProcessByPhase(phase: SalesProcess['phase']): SalesProcess | undefined {
  return SALES_PROCESSES.find(p => p.phase === phase);
}

export function getObjectionResponse(type: ObjectionHandling['objectionType']): ObjectionHandling | undefined {
  return OBJECTION_PATTERNS.find(o => o.objectionType === type);
}

export function getNextPhase(currentPhase: SalesProcess['phase']): SalesProcess['phase'] | null {
  const phases: SalesProcess['phase'][] = ['approach', 'discovery', 'presentation', 'handling', 'closing', 'follow'];
  const currentIndex = phases.indexOf(currentPhase);
  return currentIndex < phases.length - 1 ? phases[currentIndex + 1] : null;
}
