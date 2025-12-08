/**
 * 5層企業診断モデル
 *
 * Layer 1: 経営理念・ビジョン層
 * Layer 2: 戦略・事業計画層
 * Layer 3: 組織・人材層
 * Layer 4: 業務プロセス層
 * Layer 5: 顧客・市場層
 */

import type { DiagnosisLayer, DiagnosisQuestion } from './types.js';

export const DIAGNOSIS_LAYERS: DiagnosisLayer[] = [
  {
    layer: 1,
    name: '経営理念・ビジョン層',
    description: '企業の存在意義と将来像を診断',
    questions: [
      {
        id: 'l1q1',
        text: '御社の経営理念は、社員全員に浸透していますか？',
        category: 'vision',
        weight: 1.5,
      },
      {
        id: 'l1q2',
        text: '5年後、10年後のビジョンは明確に言語化されていますか？',
        category: 'vision',
        weight: 1.3,
      },
      {
        id: 'l1q3',
        text: '経営者として最も大切にしている価値観は何ですか？',
        category: 'vision',
        weight: 1.2,
      },
    ],
  },
  {
    layer: 2,
    name: '戦略・事業計画層',
    description: '事業の方向性と計画を診断',
    questions: [
      {
        id: 'l2q1',
        text: '現在の主力事業の収益性についてどのように評価されていますか？',
        category: 'strategy',
        weight: 1.4,
      },
      {
        id: 'l2q2',
        text: '新規事業や新市場への展開は計画されていますか？',
        category: 'strategy',
        weight: 1.2,
      },
      {
        id: 'l2q3',
        text: '競合との差別化ポイントは明確ですか？',
        category: 'strategy',
        weight: 1.3,
      },
    ],
  },
  {
    layer: 3,
    name: '組織・人材層',
    description: '組織体制と人材を診断',
    questions: [
      {
        id: 'l3q1',
        text: '後継者や次世代リーダーの育成は進んでいますか？',
        category: 'talent',
        weight: 1.5,
      },
      {
        id: 'l3q2',
        text: '社員のモチベーションや定着率についてどう感じていますか？',
        category: 'talent',
        weight: 1.3,
      },
      {
        id: 'l3q3',
        text: '権限委譲は適切に行われていますか？',
        category: 'talent',
        weight: 1.2,
      },
    ],
  },
  {
    layer: 4,
    name: '業務プロセス層',
    description: '業務効率と実行力を診断',
    questions: [
      {
        id: 'l4q1',
        text: '業務の標準化・マニュアル化は進んでいますか？',
        category: 'execution',
        weight: 1.2,
      },
      {
        id: 'l4q2',
        text: 'DX（デジタル変革）への取り組み状況はいかがですか？',
        category: 'innovation',
        weight: 1.3,
      },
      {
        id: 'l4q3',
        text: 'PDCAサイクルは組織として回っていますか？',
        category: 'execution',
        weight: 1.4,
      },
    ],
  },
  {
    layer: 5,
    name: '顧客・市場層',
    description: '顧客関係と市場ポジションを診断',
    questions: [
      {
        id: 'l5q1',
        text: '顧客からのフィードバックを体系的に収集・活用していますか？',
        category: 'customer',
        weight: 1.3,
      },
      {
        id: 'l5q2',
        text: '市場の変化をどのように捉え、対応していますか？',
        category: 'customer',
        weight: 1.4,
      },
      {
        id: 'l5q3',
        text: '顧客との長期的な関係構築に力を入れていますか？',
        category: 'customer',
        weight: 1.2,
      },
    ],
  },
];

export function getDiagnosisLayer(layerNumber: number): DiagnosisLayer | undefined {
  return DIAGNOSIS_LAYERS.find(l => l.layer === layerNumber);
}

export function getAllQuestions(): DiagnosisQuestion[] {
  return DIAGNOSIS_LAYERS.flatMap(layer => layer.questions);
}

export function getQuestionsByCategory(category: DiagnosisQuestion['category']): DiagnosisQuestion[] {
  return getAllQuestions().filter(q => q.category === category);
}
