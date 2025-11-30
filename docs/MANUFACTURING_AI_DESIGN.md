# 製造業AI設計書

**プロジェクト**: Miyabi Manufacturing AI - バーティカルSaaS
**親Issue**: #2 カクシン進化
**作成日**: 2025-11-30
**バージョン**: 1.0.0
**設計者**: Miyabi Development Team
**監修**: 田尻望 代表（元キーエンス）

---

## エグゼクティブサマリー

本設計書は、田尻望代表のキーエンス経験を活用した製造業特化版Miyabi AIフレームワークの設計を定義します。製造業の3大課題（品質管理、生産効率、予知保全）に対して、AI駆動の自律型ソリューションを提供し、製造現場のDXを加速します。

### 主要目標

- **品質向上**: 不良率を30-50%削減
- **生産性向上**: 稼働率を15-25%改善
- **コスト削減**: 保全コストを20-40%削減
- **ROI**: 導入後12ヶ月以内に投資回収

---

## 1. 製造業の課題分析

### 1.1 品質管理の課題

#### 現状の問題点

| 課題カテゴリ | 具体的な問題 | ビジネスインパクト |
|-------------|-------------|------------------|
| **不良率の高止まり** | - 人的検査のばらつき<br>- 目視検査の限界（微細欠陥見逃し）<br>- 検査員の疲労・経験不足 | - 不良品流出による顧客クレーム<br>- 手直し・廃棄コスト増大<br>- ブランド価値低下 |
| **検査工数の増大** | - 全数検査が必要な工程の増加<br>- 検査項目の複雑化<br>- 多品種少量生産での検査切替 | - 検査人員コスト増加<br>- リードタイム延長<br>- 検査待ち在庫の増加 |
| **トレーサビリティ不足** | - 不良発生源の特定困難<br>- ロット管理の精度不足<br>- データ記録の手作業 | - 原因分析に時間がかかる<br>- リコール範囲の拡大<br>- 再発防止策の遅れ |
| **計測精度のばらつき** | - 測定器のキャリブレーション遅れ<br>- 作業者による測定方法の差<br>- 環境要因（温度・湿度）の影響 | - 寸法不良の見逃し<br>- 過剰品質によるコスト増<br>- 顧客要求精度未達 |

#### キーエンス知見の活用ポイント

```
【田尻代表の経験から】
- センサー技術: 高精度変位センサー、画像処理センサーの活用
- 測定器ノウハウ: 非接触測定、インライン測定の実装経験
- FA機器連携: PLCとの通信、リアルタイムフィードバック制御
```

### 1.2 生産効率の課題

#### 現状の問題点

| 課題カテゴリ | 具体的な問題 | ビジネスインパクト |
|-------------|-------------|------------------|
| **稼働率の低迷** | - 設備停止時間の増加<br>- 段取り替え時間の長期化<br>- 小ロット生産による頻繁な切替 | - 生産計画の遅延<br>- 納期遅れによる機会損失<br>- 設備投資ROI低下 |
| **段取り時間の増加** | - 標準作業の未整備<br>- 熟練者への依存<br>- 段取り手順の複雑化 | - 生産性20-30%低下<br>- 残業時間増加<br>- 多品種対応力低下 |
| **在庫最適化困難** | - 需要予測精度不足<br>- 安全在庫の過剰保有<br>- 欠品リスク回避の過剰発注 | - 運転資金圧迫<br>- 在庫保管コスト増<br>- 死蔵在庫の発生 |
| **エネルギーロス** | - 設備の非効率運転<br>- 待機電力の浪費<br>- 空調・照明の無駄 | - 光熱費年間10-20%増<br>- CO2排出量増加<br>- カーボンニュートラル未達 |

### 1.3 予知保全の課題

#### 現状の問題点

| 課題カテゴリ | 具体的な問題 | ビジネスインパクト |
|-------------|-------------|------------------|
| **設備突発故障** | - 故障予兆の見逃し<br>- 予防保全の不徹底<br>- 老朽化設備の増加 | - 緊急停止による生産損失<br>- 緊急修理コスト増大<br>- 納期遅延ペナルティ |
| **ダウンタイム長期化** | - 故障原因特定に時間<br>- 交換部品の在庫切れ<br>- 修理技術者不足 | - 生産停止による損失<br>- 顧客への納期遅延<br>- 代替生産コスト |
| **保全コスト増大** | - 過剰な予防保全<br>- 部品交換時期の最適化不足<br>- 外部委託費用の増加 | - 保全費用年間15-25%増<br>- 不要な部品交換<br>- 保全人員の負担増 |
| **ノウハウ属人化** | - ベテラン保全員の退職<br>- 故障診断スキルの未伝承<br>- マニュアル整備不足 | - 修理時間の長期化<br>- 誤診による二次故障<br>- 技術継承の断絶 |

---

## 2. 品質管理AIモジュール設計

### 2.1 画像検査AI（不良品検出）

#### システムアーキテクチャ

```typescript
/**
 * 画像検査AIモジュール
 * キーエンスの画像処理技術を活用した高精度検査システム
 */
interface VisionInspectionAI {
  // 検査対象
  targetProducts: {
    productId: string;
    category: 'electronics' | 'metal' | 'plastic' | 'composite';
    inspectionPoints: InspectionPoint[];
  }[];

  // 検査項目
  inspectionTypes: {
    surfaceDefect: boolean;      // 表面欠陥（傷、打痕、汚れ）
    dimensionCheck: boolean;      // 寸法検査
    colorVerification: boolean;   // 色検証
    printInspection: boolean;     // 印字検査
    assemblyCheck: boolean;       // 組立検査
  };

  // AIモデル
  models: {
    cnn: ConvolutionalNeuralNetwork;  // 欠陥分類
    segmentation: SemanticSegmentation; // 領域抽出
    anomalyDetection: AnomalyDetector;  // 異常検知
  };
}

interface InspectionPoint {
  location: { x: number; y: number; z: number };
  defectType: string[];
  toleranceLevel: 'strict' | 'normal' | 'loose';
  ngThreshold: number; // 不良判定閾値
}
```

#### 機能仕様

##### 2.1.1 表面欠陥検査

| 機能 | 仕様 | 精度目標 |
|------|------|---------|
| **傷検出** | - 深さ0.01mm以上の傷を検出<br>- 長さ・幅・深さを測定<br>- 傷の方向性を分析 | - 検出率: 99.5%以上<br>- 誤検出率: 0.5%以下 |
| **打痕検出** | - 直径0.1mm以上の打痕を検出<br>- 深さプロファイル測定<br>- 発生工程の推定 | - 検出率: 99%以上<br>- 誤検出率: 1%以下 |
| **汚れ検査** | - 異物・油脂・塵埃の検出<br>- 汚れ面積の計測<br>- 除去可否の判定 | - 検出率: 98%以上<br>- 誤検出率: 2%以下 |

##### 2.1.2 学習データ管理

```yaml
# 学習データセット構成
datasets:
  ok_samples: 100,000    # 良品画像
  ng_samples: 50,000     # 不良品画像
  edge_cases: 10,000     # 判定困難な境界サンプル

data_augmentation:
  rotation: [-15, 15]    # 回転角度範囲
  brightness: [0.8, 1.2] # 明るさ変動
  noise: gaussian        # ノイズ追加

labeling:
  tool: 'CVAT'           # アノテーションツール
  quality_check: double_validation  # ダブルチェック
  expert_review: yes     # 専門家レビュー
```

#### キーエンス技術の活用

```
【画像処理センサー活用】
1. CV-Xシリーズ相当の高速画像処理
   - 処理速度: 1台で最大16台カメラ同時処理
   - 検査タクト: 0.1秒/個

2. 照明技術
   - 多角度照明によるエッジ強調
   - 偏光フィルタによる反射除去
   - UV照明による蛍光検査

3. カメラ配置
   - 複数カメラによる全周検査
   - ステレオカメラによる3D形状計測
   - ラインスキャンカメラによる高速検査
```

### 2.2 寸法測定AI

#### システム設計

```typescript
/**
 * AI駆動寸法測定システム
 * 非接触・高精度・リアルタイム測定
 */
interface DimensionMeasurementAI {
  // 測定方式
  measurementMethods: {
    laserDisplacement: boolean;   // レーザー変位センサー
    visionMeasurement: boolean;   // 画像測定
    contactProbe: boolean;        // 接触式プローブ
    xRayCT: boolean;             // X線CT測定
  };

  // 測定項目
  dimensions: {
    length: { min: number; max: number; tolerance: number };
    width: { min: number; max: number; tolerance: number };
    height: { min: number; max: number; tolerance: number };
    diameter: { min: number; max: number; tolerance: number };
    angle: { min: number; max: number; tolerance: number };
    surfaceRoughness: { max: number };
  };

  // AI補正
  aiCorrection: {
    temperatureCompensation: boolean;  // 温度補正
    deformationPrediction: boolean;    // 変形予測
    wearCompensation: boolean;         // 摩耗補正
  };
}
```

#### 測定精度仕様

| 測定対象 | 測定範囲 | 分解能 | 精度 | 測定速度 |
|---------|---------|--------|------|---------|
| **外径** | 0-300mm | 0.1μm | ±1μm | 100点/秒 |
| **内径** | 5-200mm | 0.5μm | ±2μm | 50点/秒 |
| **段差** | 0-50mm | 0.01μm | ±0.5μm | 200点/秒 |
| **角度** | 0-180° | 0.001° | ±0.01° | 10点/秒 |
| **平面度** | 0-100mm² | 0.1μm | ±0.5μm | 10,000点/秒 |

#### AI機能

```python
# 温度補正AI
class TemperatureCompensationAI:
    """
    温度変化による寸法変動を予測・補正
    """
    def __init__(self):
        self.material_database = {
            'steel': 11.7e-6,      # 線膨張係数 [/K]
            'aluminum': 23.1e-6,
            'copper': 16.5e-6,
            'plastic': 70e-6,
        }

    def predict_dimension(self,
                         nominal: float,
                         material: str,
                         temp_current: float,
                         temp_reference: float = 20.0) -> float:
        """
        温度補正後の寸法を予測

        Args:
            nominal: 基準温度での寸法 [mm]
            material: 材質
            temp_current: 現在温度 [℃]
            temp_reference: 基準温度 [℃]

        Returns:
            補正後寸法 [mm]
        """
        alpha = self.material_database[material]
        delta_temp = temp_current - temp_reference
        corrected = nominal * (1 + alpha * delta_temp)
        return corrected
```

### 2.3 品質トレンド予測

#### データ収集・分析基盤

```yaml
# 品質データ収集仕様
data_sources:
  inspection_results:
    frequency: realtime
    retention: 5_years
    metrics:
      - defect_rate
      - defect_type_distribution
      - measurement_values

  process_parameters:
    frequency: 1_second
    retention: 1_year
    metrics:
      - temperature
      - pressure
      - speed
      - material_batch

  environmental_conditions:
    frequency: 1_minute
    retention: 1_year
    metrics:
      - ambient_temperature
      - humidity
      - vibration

# 予測モデル
prediction_models:
  defect_rate_forecast:
    algorithm: LSTM
    horizon: 7_days
    features:
      - historical_defect_rate
      - process_parameters
      - material_lot_quality
      - operator_skill_level
    accuracy_target: 85%

  quality_degradation:
    algorithm: Prophet
    horizon: 30_days
    features:
      - tool_wear
      - machine_usage_hours
      - maintenance_history
    accuracy_target: 80%
```

#### 予測アルゴリズム

```typescript
/**
 * 品質トレンド予測エンジン
 */
interface QualityTrendPrediction {
  // 予測モデル
  models: {
    shortTerm: LSTMModel;      // 短期予測（1-7日）
    mediumTerm: ProphetModel;  // 中期予測（1-3ヶ月）
    longTerm: ARIMAModel;      // 長期予測（3-12ヶ月）
  };

  // 予測項目
  predictions: {
    defectRate: TimeSeries;           // 不良率予測
    processCapability: CPK;           // 工程能力予測
    yieldRate: TimeSeries;            // 歩留まり予測
    qualityCost: TimeSeries;          // 品質コスト予測
  };

  // アラート条件
  alerts: {
    defectRateThreshold: number;      // 不良率閾値超過
    trendDegradation: boolean;        // 品質劣化トレンド検出
    processOutOfControl: boolean;     // 工程管理外れ
  };
}
```

#### ダッシュボード設計

```
品質トレンドダッシュボード
├── リアルタイム監視
│   ├── 現在不良率
│   ├── 不良品種別内訳
│   └── 検査合格率
├── 予測分析
│   ├── 7日間不良率予測
│   ├── 工程能力指数トレンド
│   └── 品質コスト予測
├── 根本原因分析
│   ├── 不良発生パターン
│   ├── 工程別寄与度
│   └── 改善提案
└── アクション推奨
    ├── 緊急対応要否
    ├── 予防保全推奨
    └── 工程パラメータ調整案
```

---

## 3. 生産最適化AIモジュール設計

### 3.1 生産スケジューリングAI

#### システムアーキテクチャ

```typescript
/**
 * AI駆動生産スケジューリングシステム
 * 制約条件を考慮した最適スケジュール生成
 */
interface ProductionSchedulingAI {
  // 最適化エンジン
  optimizer: {
    algorithm: 'genetic_algorithm' | 'reinforcement_learning' | 'mixed_integer_programming';
    objectiveFunction: ObjectiveFunction;
    constraints: Constraint[];
  };

  // スケジューリング対象
  resources: {
    machines: Machine[];
    operators: Operator[];
    materials: Material[];
    tools: Tool[];
  };

  // 最適化目標
  objectives: {
    minimizeMakespan: boolean;        // 最大完成時間最小化
    maximizeThroughput: boolean;      // 生産量最大化
    minimizeSetupTime: boolean;       // 段取り時間最小化
    balanceWorkload: boolean;         // 負荷平準化
    meetDeliveryDate: boolean;        // 納期遵守
  };
}

interface ObjectiveFunction {
  // 重み付け多目的最適化
  weights: {
    deliveryCompliance: number;       // 納期遵守: 40%
    productionEfficiency: number;     // 生産効率: 30%
    setupReduction: number;           // 段取り削減: 20%
    resourceUtilization: number;      // 稼働率: 10%
  };

  totalScore: number;
}
```

#### 制約条件

```yaml
# スケジューリング制約
constraints:
  hard_constraints:
    - type: machine_capacity
      description: 機械の同時加工数上限

    - type: operator_skill
      description: 作業者のスキルマトリクス

    - type: material_availability
      description: 材料の在庫・納入スケジュール

    - type: tool_life
      description: 工具の残存寿命

    - type: preventive_maintenance
      description: 定期保全スケジュール

  soft_constraints:
    - type: setup_sequence
      description: 段取り最小化のための製品順序
      priority: high

    - type: operator_preference
      description: 作業者の習熟度・希望
      priority: medium

    - type: energy_cost
      description: 電力料金時間帯最適化
      priority: low
```

#### AIアルゴリズム

```python
# 強化学習による動的スケジューリング
class ReinforcementLearningScheduler:
    """
    Deep Q-Network (DQN) による生産スケジューリング
    """
    def __init__(self):
        self.state_space = StateSpace(
            queue_length=100,
            machine_status=20,
            operator_status=50,
            inventory_level=200
        )

        self.action_space = ActionSpace(
            job_selection=True,
            machine_assignment=True,
            operator_assignment=True,
            priority_override=True
        )

        self.dqn_model = self._build_dqn()

    def _build_dqn(self):
        """DQNモデル構築"""
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(256, activation='relu', input_shape=(self.state_space.dim,)),
            tf.keras.layers.Dense(256, activation='relu'),
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.Dense(self.action_space.dim, activation='linear')
        ])
        model.compile(optimizer='adam', loss='mse')
        return model

    def get_optimal_action(self, current_state: State) -> Action:
        """
        現在状態から最適なアクションを選択
        """
        q_values = self.dqn_model.predict(current_state.vector)
        action_index = np.argmax(q_values)
        return self.action_space.actions[action_index]
```

### 3.2 在庫最適化AI

#### 在庫管理モデル

```typescript
/**
 * AI駆動在庫最適化システム
 * 需要予測と多段階在庫最適化
 */
interface InventoryOptimizationAI {
  // 需要予測
  demandForecasting: {
    model: 'prophet' | 'lstm' | 'arima';
    horizon: number; // 予測期間（日数）
    confidence_interval: number; // 信頼区間（%）
  };

  // 在庫最適化
  optimization: {
    method: 'dynamic_programming' | 'stochastic_optimization';
    safety_stock_calculation: SafetyStockModel;
    reorder_point_calculation: ReorderPointModel;
  };

  // 在庫階層
  inventoryLevels: {
    rawMaterial: InventoryLevel;
    workInProcess: InventoryLevel;
    finishedGoods: InventoryLevel;
  };
}

interface SafetyStockModel {
  // 安全在庫計算
  formula: 'statistical' | 'service_level';
  parameters: {
    lead_time_variability: number;
    demand_variability: number;
    service_level: number; // 99.5%
  };
}
```

#### 需要予測精度

| 品目カテゴリ | 予測手法 | 精度目標（MAPE） | 更新頻度 |
|-------------|---------|-----------------|---------|
| **定番品** | Prophet | 5%以下 | 毎週 |
| **季節商品** | LSTM | 10%以下 | 毎週 |
| **新製品** | 類似品分析 | 20%以下 | 毎日 |
| **受注生産品** | 確定受注 | - | リアルタイム |

#### 在庫削減効果

```
【キーエンス知見：適正在庫の考え方】

Before（従来方式）:
- 安全在庫: 30日分
- 発注点: 45日分
- 平均在庫回転率: 年12回

After（AI最適化）:
- 安全在庫: 15日分（需要予測精度向上）
- 発注点: 20日分（リードタイム短縮）
- 平均在庫回転率: 年24回

削減効果:
- 在庫金額: 50%削減
- 保管コスト: 40%削減
- 欠品率: 0.5%未満維持
```

### 3.3 エネルギー効率最適化

#### システム設計

```typescript
/**
 * エネルギー最適化AIシステム
 * リアルタイム電力監視と最適制御
 */
interface EnergyOptimizationAI {
  // 電力監視
  powerMonitoring: {
    machines: PowerMeter[];
    facilities: PowerMeter[];
    totalConsumption: number; // kWh
    peakDemand: number; // kW
  };

  // 最適化制御
  optimization: {
    loadShifting: boolean;           // 負荷シフト
    demandResponse: boolean;         // デマンドレスポンス
    renewableIntegration: boolean;   // 再エネ連携
  };

  // 予測モデル
  predictions: {
    hourlyConsumption: TimeSeries;
    peakDemandForecast: TimeSeries;
    costForecast: TimeSeries;
  };
}
```

#### 最適化戦略

```yaml
# エネルギー最適化戦略
strategies:
  peak_cut:
    description: ピーク電力削減
    methods:
      - 高負荷設備の分散稼働
      - バッチ処理の時間帯調整
      - 空調の事前冷房・予冷
    target: 15%削減

  load_leveling:
    description: 負荷平準化
    methods:
      - 蓄熱・蓄電システム活用
      - 生産スケジュールの平準化
      - 待機電力の削減
    target: 20%改善

  renewable_usage:
    description: 再エネ活用
    methods:
      - 太陽光発電の優先使用
      - 蓄電池の充放電制御
      - グリーン電力メニュー選択
    target: 30%置換

# コスト削減効果
cost_reduction:
  electricity_bill:
    before: 1,000,000  # 円/月
    after: 750,000     # 円/月
    reduction: 25%

  co2_emission:
    before: 100  # ton-CO2/月
    after: 70    # ton-CO2/月
    reduction: 30%
```

---

## 4. キーエンス知見の体系化

### 4.1 センサーデータ活用パターン

#### データ収集アーキテクチャ

```
【キーエンス流IoTアーキテクチャ】

生産現場
├── センサー層
│   ├── 変位センサー（レーザー、渦電流、接触式）
│   ├── 画像センサー（カメラ、照明、レンズ）
│   ├── 流量センサー（電磁式、超音波式）
│   ├── 圧力センサー（圧電式、静電容量式）
│   └── 温度センサー（熱電対、測温抵抗体）
│
├── エッジ処理層
│   ├── PLC（プログラマブルロジックコントローラー）
│   ├── 画像処理コントローラー
│   ├── データロガー
│   └── エッジAIデバイス
│
├── ネットワーク層
│   ├── 産業用Ethernet（EtherNet/IP、PROFINET）
│   ├── フィールドバス（CC-Link、PROFIBUS）
│   └── 無線（Wi-Fi、5G、LoRaWAN）
│
└── クラウド・分析層
    ├── データレイク（時系列DB）
    ├── AI分析エンジン
    ├── ダッシュボード
    └── アラート・通知
```

#### センサーデータ活用事例

```typescript
/**
 * キーエンス型センサーデータ活用パターン
 */
interface KeyenceSensorPattern {
  // Pattern 1: 高精度計測による全数検査
  pattern1_FullInspection: {
    sensor: 'LaserDisplacementSensor';
    application: '電子部品の高さ測定';
    specification: {
      measurementRange: '±10mm';
      resolution: '0.01μm';
      samplingRate: '50kHz';
    };
    effect: {
      inspectionSpeed: '300個/分 → 3000個/分（10倍）';
      defectDetection: '不良流出ゼロ';
    };
  };

  // Pattern 2: 画像処理による外観検査自動化
  pattern2_VisionInspection: {
    sensor: 'VisionSensor';
    application: '基板実装検査';
    specification: {
      resolution: '5メガピクセル';
      processingSpeed: '0.05秒/枚';
      defectTypes: ['欠品', 'ズレ', '極性反転', '半田不良'];
    };
    effect: {
      inspectionTime: '30秒/枚 → 0.05秒/枚（600倍）';
      detectionRate: '99.9%以上';
    };
  };

  // Pattern 3: リアルタイム監視による異常予知
  pattern3_AnomalyPrediction: {
    sensors: ['VibrationSensor', 'CurrentSensor', 'TemperatureSensor'];
    application: 'モーター異常予知';
    aiModel: 'IsolationForest';
    effect: {
      downtimeReduction: '年間100時間 → 10時間（90%削減）';
      maintenanceCost: '30%削減';
    };
  };
}
```

### 4.2 FA機器連携ノウハウ

#### PLC連携パターン

```python
# PLC通信ライブラリ（Python実装例）
class PLCConnector:
    """
    キーエンスPLC（KV-8000シリーズ相当）との通信
    """
    def __init__(self, ip_address: str, port: int = 8501):
        self.ip = ip_address
        self.port = port
        self.protocol = 'EtherNet/IP'

    def read_device(self, device_name: str) -> Any:
        """
        デバイス値読み取り

        Args:
            device_name: デバイス名（例: 'DM100', 'R500'）

        Returns:
            デバイス値
        """
        # EtherNet/IP通信実装
        pass

    def write_device(self, device_name: str, value: Any) -> bool:
        """
        デバイス値書き込み
        """
        # EtherNet/IP通信実装
        pass

    def batch_read(self, device_list: List[str]) -> Dict[str, Any]:
        """
        複数デバイス一括読み取り（高速化）
        """
        # バッチリード実装
        pass

# 活用例：リアルタイムフィードバック制御
class RealtimeFeedbackControl:
    """
    センサー値に基づくPLC制御
    """
    def __init__(self, plc: PLCConnector):
        self.plc = plc

    def control_loop(self):
        """
        制御ループ（10ms周期）
        """
        while True:
            # センサー値読み取り
            sensor_value = self.plc.read_device('DM100')

            # AI判定
            is_ok, control_value = self.ai_judge(sensor_value)

            # PLC制御出力
            self.plc.write_device('DM200', control_value)

            time.sleep(0.01)  # 10ms
```

#### データ統合パターン

```yaml
# FA機器データ統合仕様
data_integration:
  plc_data:
    protocol: EtherNet/IP
    polling_interval: 100ms
    data_points:
      - production_count
      - cycle_time
      - alarm_status
      - operating_mode

  vision_sensor:
    protocol: TCP/IP
    trigger: external
    data_points:
      - inspection_result
      - defect_coordinates
      - image_path

  measurement_sensor:
    protocol: Modbus TCP
    sampling_rate: 1kHz
    data_points:
      - dimension_value
      - tolerance_status
      - measurement_timestamp

# データ同期
synchronization:
  method: timestamp_alignment
  precision: 1ms
  buffer_size: 10000_points
```

### 4.3 「付加価値のつくりかた」製造業版

#### キーエンス哲学の体系化

```
【付加価値創造の5原則】

1. 最小の投入で最大の成果
   - センサー1台で複数項目を同時測定
   - 既存設備への後付け対応
   - ROI 1年以内を目標

2. 見える化から始まる改善
   - リアルタイムデータ可視化
   - 誰でもわかるダッシュボード
   - 異常の即座な通知

3. 自動化による人の解放
   - 単純作業の自動化
   - 高度な判断業務への集中
   - スキルアップ機会の創出

4. データ駆動の意思決定
   - 勘・経験に頼らない
   - 数値根拠のある改善
   - PDCAサイクルの高速化

5. 顧客価値の最大化
   - 品質向上による顧客満足
   - リードタイム短縮
   - コスト削減の還元
```

#### 製造業AI導入の3ステップ

```typescript
/**
 * 製造業AI導入ロードマップ
 */
interface AIAdoptionRoadmap {
  // Step 1: クイックウィン（3ヶ月）
  step1_QuickWin: {
    target: '効果が見えやすい領域から開始';
    activities: [
      '画像検査AIによる不良品検出',
      '既存センサーデータの可視化',
      'エクセル作業の自動化'
    ];
    kpi: {
      roi: '6ヶ月以内';
      defectReduction: '30%削減';
      worktimeReduction: '50%削減';
    };
  };

  // Step 2: スケールアウト（6ヶ月）
  step2_ScaleOut: {
    target: '成功パターンの横展開';
    activities: [
      '他工程への画像検査AI展開',
      '予知保全AIの導入',
      '生産スケジューリングAI試験運用'
    ];
    kpi: {
      coverage: '全工程の50%';
      productivity: '15%向上';
      energySaving: '20%削減';
    };
  };

  // Step 3: 全体最適（12ヶ月）
  step3_Optimization: {
    target: '工場全体の最適化';
    activities: [
      'サプライチェーン連携',
      '需要予測と生産計画の自動化',
      'ダークファクトリー（無人化）への移行'
    ];
    kpi: {
      leadtime: '50%短縮';
      inventory: '40%削減';
      laborProductivity: '2倍';
    };
  };
}
```

---

## 5. PoC計画（3ヶ月）

### 5.1 対象顧客選定基準

#### 理想的なPoC顧客プロファイル

```yaml
# PoC顧客選定クライテリア
selection_criteria:
  industry:
    primary:
      - 電子部品製造
      - 精密機器製造
      - 自動車部品製造
    secondary:
      - 金属加工
      - プラスチック成形
      - 食品製造

  company_size:
    employees: 100-1000名
    revenue: 50億円-500億円
    reason: 意思決定が早く、投資余力あり

  pain_points:
    high_priority:
      - 不良率が業界平均より高い（2%以上）
      - 人手不足で検査員確保が困難
      - 顧客からの品質要求厳格化
    medium_priority:
      - 生産性向上の壁に直面
      - ベテラン技術者の退職予定
      - 海外競合との価格競争

  readiness:
    infrastructure:
      - インターネット接続可能
      - 一部センサー・PLCが既設
      - データ収集の経験あり
    culture:
      - 経営層がDXに前向き
      - 現場の改善意欲が高い
      - 失敗を許容する文化

# スコアリングシート
scoring:
  pain_severity: 30点
  decision_speed: 25点
  budget_availability: 20点
  technical_readiness: 15点
  cultural_fit: 10点
  total: 100点

  threshold: 70点以上でPoC候補
```

#### ターゲット企業リスト例

| 企業名（仮） | 業種 | 従業員数 | スコア | 主要課題 | 推奨AIソリューション |
|------------|------|---------|-------|---------|-------------------|
| A精密工業 | 電子部品 | 300名 | 85点 | 不良率3.5%、検査員不足 | 画像検査AI |
| B金属加工 | 金属加工 | 150名 | 78点 | 設備故障頻発、稼働率70% | 予知保全AI |
| C樹脂成形 | プラスチック | 500名 | 72点 | 在庫過多、欠品頻発 | 在庫最適化AI |

### 5.2 実証実験項目

#### PoC実施計画

```
【3ヶ月PoC タイムライン】

Week 1-2: 準備フェーズ
├── キックオフミーティング
├── 現状調査（現場視察、データ収集状況確認）
├── 課題の優先順位付け
└── KPI設定

Week 3-6: 環境構築フェーズ
├── センサー・カメラ設置
├── データ収集基盤構築
├── ネットワーク設定
└── 初期データ収集開始

Week 7-10: AI学習フェーズ
├── 学習データ準備（ラベリング）
├── AIモデル学習
├── 精度検証・チューニング
└── 現場テスト

Week 11-12: 本番運用フェーズ
├── 本番環境デプロイ
├── 運用トレーニング
├── 効果測定
└── 最終報告会
```

#### 実験内容詳細

##### PoC-1: 画像検査AI（電子部品メーカー A社）

```yaml
experiment_1:
  company: A精密工業株式会社
  target_process: プリント基板実装検査

  current_situation:
    inspection_method: 人による目視検査
    inspection_time: 30秒/枚
    throughput: 120枚/時間
    defect_rate: 3.5%（業界平均2.0%）
    inspector_count: 5名（3交代）

  ai_solution:
    system: VisionInspectionAI
    cameras: 4台（基板上面×2、下面×2）
    inspection_items:
      - 部品欠品
      - 部品ズレ
      - 極性反転
      - 半田不良
      - 異物混入

  success_metrics:
    inspection_time: 30秒 → 5秒（83%削減）
    throughput: 120枚 → 720枚（6倍）
    defect_detection_rate: 99%以上
    false_positive_rate: 1%以下
    inspector_reduction: 5名 → 2名（60%削減）

  investment:
    hardware: 300万円（カメラ、照明、PC）
    software: 50万円/月（AIライセンス）
    setup: 100万円（設置・調整）
    total_3months: 550万円

  expected_roi:
    labor_cost_saving: 30万円/月 × 3名 = 90万円/月
    quality_improvement: クレーム削減 20万円/月
    productivity_gain: 増産による売上増 50万円/月
    total_benefit: 160万円/月
    payback_period: 3.4ヶ月
```

##### PoC-2: 予知保全AI（金属加工 B社）

```yaml
experiment_2:
  company: B金属加工株式会社
  target_equipment: CNC旋盤（10台）

  current_situation:
    maintenance_method: 時間基準保全（TBM）
    unplanned_downtime: 年間100時間/台
    maintenance_cost: 年間500万円
    machine_availability: 70%

  ai_solution:
    system: PredictiveMaintenanceAI
    sensors:
      - 振動センサー: 10台
      - 電流センサー: 10台
      - 温度センサー: 10台
    monitoring_frequency: 1秒
    prediction_horizon: 7日前

  success_metrics:
    unplanned_downtime: 100時間 → 20時間（80%削減）
    machine_availability: 70% → 85%（15%向上）
    maintenance_cost: 500万円 → 350万円（30%削減）
    false_alarm_rate: 5%以下

  investment:
    hardware: 200万円（センサー、ゲートウェイ）
    software: 40万円/月（AI分析）
    setup: 80万円
    total_3months: 400万円

  expected_roi:
    downtime_reduction: 稼働時間増による売上増 80万円/月
    maintenance_cost_saving: 12.5万円/月
    total_benefit: 92.5万円/月
    payback_period: 4.3ヶ月
```

##### PoC-3: 在庫最適化AI（樹脂成形 C社）

```yaml
experiment_3:
  company: C樹脂成形株式会社
  target_items: 樹脂原材料（50品目）

  current_situation:
    inventory_turnover: 年12回
    average_inventory: 5,000万円
    stockout_rate: 5%/月
    excess_inventory: 1,000万円

  ai_solution:
    system: InventoryOptimizationAI
    forecast_model: Prophet + LSTM
    optimization: DynamicProgramming
    update_frequency: 毎日

  success_metrics:
    inventory_turnover: 12回 → 24回（2倍）
    average_inventory: 5,000万円 → 2,500万円（50%削減）
    stockout_rate: 5% → 0.5%（90%改善）
    forecast_accuracy: MAPE 8%以下

  investment:
    hardware: 50万円（サーバー）
    software: 30万円/月（AI分析）
    setup: 70万円（データ整備）
    total_3months: 210万円

  expected_roi:
    inventory_reduction: 2,500万円 × 年利2% ÷ 12 = 42万円/月
    stockout_loss_reduction: 50万円/月
    total_benefit: 92万円/月
    payback_period: 2.3ヶ月
```

### 5.3 評価指標（ROI、品質向上率等）

#### KPI体系

```typescript
/**
 * PoC評価指標
 */
interface PoCEvaluationKPI {
  // 財務指標
  financial: {
    roi: {
      target: number;              // 目標ROI（%）
      actual: number;              // 実績ROI（%）
      paybackPeriod: number;       // 投資回収期間（月）
    };
    costReduction: {
      laborCost: number;           // 人件費削減（円/月）
      qualityCost: number;         // 品質コスト削減（円/月）
      energyCost: number;          // エネルギーコスト削減（円/月）
      total: number;               // 合計削減額（円/月）
    };
    revenueIncrease: {
      productivity: number;        // 生産性向上による増収（円/月）
      qualityImprovement: number;  // 品質向上による増収（円/月）
      total: number;               // 合計増収（円/月）
    };
  };

  // 品質指標
  quality: {
    defectRate: {
      before: number;              // 導入前不良率（%）
      after: number;               // 導入後不良率（%）
      improvement: number;         // 改善率（%）
    };
    inspectionAccuracy: {
      detectionRate: number;       // 検出率（%）
      falsePositiveRate: number;   // 誤検出率（%）
    };
    customerComplaints: {
      before: number;              // 導入前クレーム件数（件/月）
      after: number;               // 導入後クレーム件数（件/月）
      reduction: number;           // 削減率（%）
    };
  };

  // 生産性指標
  productivity: {
    throughput: {
      before: number;              // 導入前生産量（個/時間）
      after: number;               // 導入後生産量（個/時間）
      improvement: number;         // 改善率（%）
    };
    cycleTime: {
      before: number;              // 導入前サイクルタイム（秒）
      after: number;               // 導入後サイクルタイム（秒）
      reduction: number;           // 短縮率（%）
    };
    oee: {
      before: number;              // 導入前設備総合効率（%）
      after: number;               // 導入後設備総合効率（%）
      improvement: number;         // 改善ポイント
    };
  };

  // 運用指標
  operations: {
    systemAvailability: number;    // システム稼働率（%）
    mtbf: number;                  // 平均故障間隔（時間）
    mttr: number;                  // 平均修復時間（時間）
    userSatisfaction: number;      // ユーザー満足度（5段階）
  };
}
```

#### ROI計算モデル

```python
# ROI計算ツール
class ROICalculator:
    """
    製造業AI導入のROI計算
    """
    def __init__(self):
        self.period_months = 36  # 3年間で評価

    def calculate_roi(self, investment: Investment, benefits: Benefits) -> ROIResult:
        """
        ROI計算

        Args:
            investment: 初期投資 + ランニングコスト
            benefits: 月次便益

        Returns:
            ROI分析結果
        """
        # 初期投資
        initial_cost = investment.hardware + investment.software_setup + investment.installation

        # 月次ランニングコスト
        monthly_cost = investment.software_license + investment.maintenance

        # 月次便益
        monthly_benefit = (
            benefits.labor_cost_saving +
            benefits.quality_improvement +
            benefits.productivity_gain +
            benefits.energy_saving
        )

        # 月次キャッシュフロー
        monthly_cashflow = monthly_benefit - monthly_cost

        # 累積キャッシュフロー計算
        cumulative_cashflow = [-initial_cost]
        for month in range(1, self.period_months + 1):
            cumulative_cashflow.append(
                cumulative_cashflow[-1] + monthly_cashflow
            )

        # 投資回収期間
        payback_period = self._find_payback_period(cumulative_cashflow)

        # ROI計算（3年間）
        total_benefit = monthly_benefit * self.period_months
        total_cost = initial_cost + monthly_cost * self.period_months
        roi_percentage = ((total_benefit - total_cost) / total_cost) * 100

        # NPV計算（割引率5%）
        npv = self._calculate_npv(initial_cost, monthly_cashflow, discount_rate=0.05)

        return ROIResult(
            roi_percentage=roi_percentage,
            payback_period_months=payback_period,
            npv=npv,
            total_benefit=total_benefit,
            total_cost=total_cost
        )

    def _find_payback_period(self, cumulative_cashflow: List[float]) -> float:
        """投資回収期間計算"""
        for i, cf in enumerate(cumulative_cashflow):
            if cf >= 0:
                # 線形補間で正確な月数を計算
                prev_cf = cumulative_cashflow[i-1]
                fraction = -prev_cf / (cf - prev_cf)
                return i - 1 + fraction
        return None  # 回収不可

    def _calculate_npv(self, initial_cost: float, monthly_cashflow: float,
                       discount_rate: float) -> float:
        """正味現在価値（NPV）計算"""
        monthly_rate = (1 + discount_rate) ** (1/12) - 1
        npv = -initial_cost
        for month in range(1, self.period_months + 1):
            npv += monthly_cashflow / ((1 + monthly_rate) ** month)
        return npv

# 使用例
calculator = ROICalculator()

investment = Investment(
    hardware=3_000_000,
    software_setup=500_000,
    installation=1_000_000,
    software_license=500_000,
    maintenance=100_000
)

benefits = Benefits(
    labor_cost_saving=900_000,
    quality_improvement=200_000,
    productivity_gain=500_000,
    energy_saving=100_000
)

result = calculator.calculate_roi(investment, benefits)
print(f"ROI: {result.roi_percentage:.1f}%")
print(f"投資回収期間: {result.payback_period_months:.1f}ヶ月")
print(f"NPV: {result.npv:,.0f}円")
```

#### ダッシュボード設計

```
【PoC進捗ダッシュボード】

┌─────────────────────────────────────────────────────┐
│ Miyabi Manufacturing AI - PoC Dashboard           │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [財務指標]                                          │
│ ┌──────────┬──────────┬──────────┐                 │
│ │ 目標ROI  │ 実績ROI  │ 達成率   │                 │
│ │ 300%     │ 427%     │ 142%     │                 │
│ └──────────┴──────────┴──────────┘                 │
│                                                     │
│ 投資回収期間: 3.4ヶ月（目標: 6ヶ月以内）           │
│ 月次削減額: 160万円                                 │
│                                                     │
│ [品質指標]                                          │
│ ┌──────────────────────────────┐                   │
│ │ 不良率トレンド                │                   │
│ │ 3.5% → 0.8% (77%改善)        │                   │
│ │ ████████████░░░░░░░░          │                   │
│ └──────────────────────────────┘                   │
│                                                     │
│ [生産性指標]                                        │
│ ┌──────────────────────────────┐                   │
│ │ 検査スループット              │                   │
│ │ 120個/h → 720個/h (6倍)      │                   │
│ │ ██████████████████████████   │                   │
│ └──────────────────────────────┘                   │
│                                                     │
│ [顧客満足度]                                        │
│ ★★★★★ (5.0/5.0)                                   │
│ - 使いやすさ: 4.8                                   │
│ - 効果実感: 5.0                                     │
│ - サポート: 4.9                                     │
└─────────────────────────────────────────────────────┘
```

---

## 6. 技術スタック

### 6.1 AIモデル・フレームワーク

```yaml
# AI技術スタック
ai_frameworks:
  computer_vision:
    framework: PyTorch, TensorFlow
    models:
      - ResNet-50（特徴抽出）
      - YOLO v8（物体検出）
      - U-Net（セグメンテーション）
      - EfficientNet（軽量推論）

  time_series:
    framework: Prophet, LSTM, ARIMA
    libraries:
      - pandas
      - numpy
      - scikit-learn
      - statsmodels

  optimization:
    algorithms:
      - 遺伝的アルゴリズム（DEAP）
      - 強化学習（Stable-Baselines3）
      - 混合整数計画法（PuLP, OR-Tools）

  deployment:
    edge: ONNX Runtime, TensorRT
    cloud: AWS SageMaker, Azure ML
    mlops: MLflow, Kubeflow
```

### 6.2 データ基盤

```yaml
# データ基盤
data_platform:
  time_series_db:
    primary: InfluxDB
    retention: 5_years
    compression: enabled

  data_lake:
    storage: AWS S3, Azure Blob
    format: Parquet
    partitioning: by_date_and_factory

  real_time_streaming:
    platform: Apache Kafka
    throughput: 100k_messages/sec
    latency: < 10ms

  etl:
    tool: Apache Airflow
    schedule: hourly, daily, weekly
    data_quality: Great Expectations
```

### 6.3 可視化・UI

```yaml
# 可視化ツール
visualization:
  dashboard:
    tool: Grafana, Power BI
    update: realtime
    access: web, mobile

  reporting:
    format: PDF, Excel, PowerPoint
    schedule: daily, weekly, monthly
    distribution: email, Slack, Teams

  alerting:
    channels:
      - email
      - SMS
      - Slack
      - LINE
    severity_levels:
      - Critical（即座）
      - High（5分以内）
      - Medium（1時間以内）
      - Low（日次レポート）
```

---

## 7. セキュリティ・コンプライアンス

### 7.1 セキュリティ要件

```yaml
# セキュリティ対策
security:
  network:
    - ファイアウォール設定
    - VPN接続（工場-クラウド間）
    - ネットワーク分離（OT/IT）

  authentication:
    - 多要素認証（MFA）
    - Role-Based Access Control (RBAC)
    - シングルサインオン（SSO）

  data_protection:
    - 暗号化（AES-256）
      - 保存時暗号化
      - 通信時暗号化（TLS 1.3）
    - 個人情報マスキング
    - データバックアップ（日次）

  compliance:
    - ISO 27001準拠
    - 製造業サイバーセキュリティガイドライン準拠
    - GDPR対応（EU顧客向け）
```

### 7.2 監査ログ

```typescript
/**
 * 監査ログ仕様
 */
interface AuditLog {
  timestamp: Date;
  userId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  resource: string;
  ip_address: string;
  result: 'success' | 'failure';
  details: object;
}

// 保存期間: 7年間（製造業の記録保存要件準拠）
// 改ざん防止: Blockchain技術活用
```

---

## 8. 導入・サポート体制

### 8.1 導入プロセス

```
【標準導入フロー（3-6ヶ月）】

Phase 1: 要件定義（2週間）
├── 現状調査
├── 課題抽出
├── KPI設定
└── 提案書作成

Phase 2: 環境構築（4週間）
├── ハードウェア設置
├── ネットワーク構築
├── ソフトウェアインストール
└── 初期設定

Phase 3: データ収集・学習（6週間）
├── データ収集
├── ラベリング
├── AIモデル学習
└── 精度検証

Phase 4: テスト運用（4週間）
├── パイロット運用
├── 現場フィードバック
├── チューニング
└── 承認

Phase 5: 本番展開（2週間）
├── 本番環境移行
├── ユーザートレーニング
├── 運用マニュアル整備
└── 引き渡し
```

### 8.2 サポート体制

```yaml
# カスタマーサポート
support:
  tiers:
    tier1_basic:
      price: 基本料金に含む
      hours: 平日9-17時
      channels: [email, web]
      response_time: 24時間以内

    tier2_standard:
      price: +10万円/月
      hours: 平日8-20時
      channels: [email, web, phone]
      response_time: 4時間以内

    tier3_premium:
      price: +30万円/月
      hours: 24時間365日
      channels: [email, web, phone, Slack]
      response_time: 1時間以内
      dedicated_engineer: yes

  services:
    - システム監視・障害対応
    - 定期メンテナンス
    - AIモデル再学習
    - 機能追加・カスタマイズ
    - オンサイトサポート
    - トレーニング・教育
```

---

## 9. ビジネスモデル

### 9.1 価格体系

```yaml
# 価格プラン
pricing:
  initial_setup:
    base_fee: 500万円
    includes:
      - 要件定義
      - 環境構築
      - 初期学習
      - トレーニング（5日間）

  monthly_subscription:
    starter:
      price: 50万円/月
      includes:
        - 基本AIモジュール1種類
        - データ保存1TB
        - ユーザー数10名
        - サポート: Tier1

    professional:
      price: 150万円/月
      includes:
        - AIモジュール3種類まで
        - データ保存5TB
        - ユーザー数50名
        - サポート: Tier2
        - カスタマイズ可能

    enterprise:
      price: 300万円/月〜
      includes:
        - 全AIモジュール
        - データ保存無制限
        - ユーザー数無制限
        - サポート: Tier3
        - 専任エンジニア
        - マルチサイト対応

# オプション料金
options:
  additional_ai_module: 30万円/月
  custom_development: 200万円〜
  on_premise_deployment: +50%
  multi_language_support: +20%
```

### 9.2 収益モデル

```
【3年間収益予測】

Year 1（PoC + 初期顧客獲得）:
- 顧客数: 5社
- 初期費用: 500万円 × 5社 = 2,500万円
- 月額売上: 150万円 × 5社 × 平均8ヶ月 = 6,000万円
- 年間売上: 8,500万円

Year 2（スケールアウト）:
- 新規顧客: 20社
- 既存顧客継続: 5社
- 初期費用: 500万円 × 20社 = 1億円
- 月額売上: 150万円 × 25社 × 12ヶ月 = 4.5億円
- 年間売上: 5.5億円

Year 3（市場拡大）:
- 新規顧客: 50社
- 既存顧客継続: 25社
- 初期費用: 500万円 × 50社 = 2.5億円
- 月額売上: 150万円 × 75社 × 12ヶ月 = 13.5億円
- 年間売上: 16億円

累計3年間売上: 30億円
```

---

## 10. まとめ・次のアクション

### 10.1 期待される効果

```
【Miyabi Manufacturing AIの導入効果】

定量効果:
✓ 不良率: 30-50%削減
✓ 生産性: 15-25%向上
✓ 設備稼働率: 15%向上
✓ 在庫削減: 40%削減
✓ エネルギーコスト: 20%削減
✓ 保全コスト: 30%削減
✓ ROI: 12ヶ月以内

定性効果:
✓ 検査員の負担軽減・高度業務へのシフト
✓ 技術継承問題の解決（AI化によるノウハウ保存）
✓ データ駆動の意思決定文化の醸成
✓ 顧客満足度向上（品質・納期改善）
✓ 競争優位性の確立
```

### 10.2 次のアクション

```typescript
/**
 * アクションプラン
 */
interface NextActions {
  immediate: {
    action1: 'PoC顧客リストの作成（A精密工業、B金属加工、C樹脂成形）';
    action2: '営業資料・デモ動画の準備';
    action3: 'キーエンス技術顧問の招聘（田尻代表の人脈活用）';
    deadline: '2週間以内';
  };

  shortTerm: {
    action1: 'PoC顧客との初回ミーティング設定';
    action2: 'パートナー企業の選定（センサーメーカー、SIer）';
    action3: 'AIモデルのプロトタイプ開発開始';
    deadline: '1ヶ月以内';
  };

  mediumTerm: {
    action1: 'PoC実施（3社同時並行）';
    action2: '成功事例の作成・広報';
    action3: '製品化に向けた機能拡張';
    deadline: '3ヶ月以内';
  };
}
```

### 10.3 成功の鍵

```
【成功要因】

1. 田尻代表のキーエンス経験を最大活用
   - センサー技術の深い理解
   - 製造現場の課題を肌で知っている
   - 「付加価値のつくりかた」哲学の体現

2. クイックウィンの実現
   - 効果が見えやすい領域から開始
   - 3ヶ月で投資回収できることを証明
   - 成功体験の積み重ね

3. 製造業特化の徹底
   - 汎用SaaSではなくバーティカルSaaS
   - 業界知見の深さが差別化要因
   - キーエンス品質へのこだわり

4. データ駆動の意思決定
   - 全てのKPIを数値化
   - 継続的な改善サイクル
   - エビデンスベースの提案

5. パートナーエコシステム
   - センサーメーカーとの協業
   - SIerとの連携
   - 顧客コミュニティの形成
```

---

## 付録

### A. 用語集

| 用語 | 説明 |
|------|------|
| **OEE** | Overall Equipment Effectiveness（設備総合効率）= 稼働率 × 性能 × 良品率 |
| **CPK** | Process Capability Index（工程能力指数）品質のばらつきを示す指標 |
| **MTBF** | Mean Time Between Failures（平均故障間隔） |
| **MTTR** | Mean Time To Repair（平均修復時間） |
| **TBM** | Time-Based Maintenance（時間基準保全） |
| **CBM** | Condition-Based Maintenance（状態基準保全） |
| **PdM** | Predictive Maintenance（予知保全） |

### B. 参考文献

```
1. キーエンス社 技術資料
   - 「画像処理入門ガイド」
   - 「変位センサー選定ガイド」
   - 「IoTシステム構築の基礎」

2. 製造業DX関連書籍
   - 「製造業のためのAI導入ガイド」
   - 「スマートファクトリー実践手法」
   - 「予知保全の理論と実践」

3. 学術論文
   - "Deep Learning for Manufacturing: A Comprehensive Review"
   - "Predictive Maintenance in Industry 4.0"
   - "Computer Vision for Quality Inspection"
```

### C. お問い合わせ

```
Miyabi Manufacturing AI チーム
Email: manufacturing@miyabi.ai
Web: https://miyabi.ai/manufacturing
Phone: 03-XXXX-XXXX

代表: 田尻望（元キーエンス）
専門: センサー技術、FA機器、製造業DX
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-30
**Next Review**: 2026-02-28

**Status**: PoC準備完了 - 顧客アプローチ開始可能

---

