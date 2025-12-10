/**
 * ワークフローエンジン
 * アバター構築ワークフローの管理
 */

import type {
  WorkflowMetadata,
  AvatarWorkflow,
  WorkflowPhase,
  PhaseStatus,
  PhaseRecord,
  ApprovalRecord,
  ApprovalDecision,
  ApprovalStatus,
  ValidationRecord,
  TrialPeriod,
  TrialMetrics,
  TrialFeedback,
  TrialCheckpoint,
  FinalStatus,
  WorkflowConfig,
} from './types.js';
import type { BaseAvatarTemplate } from '../base/types.js';
import { ValidationEngine } from './validation-engine.js';

const PHASE_ORDER: WorkflowPhase[] = ['requirements', 'design', 'build', 'validation', 'trial', 'adoption'];

const DEFAULT_CONFIG: WorkflowConfig = {
  trialDays: 30,
  requiredApprovers: {
    requirements: ['product-owner'],
    design: ['tech-lead', 'product-owner'],
    build: ['tech-lead'],
    validation: ['qa-lead'],
    trial: ['product-owner', 'client-success'],
    adoption: ['product-owner', 'tech-lead'],
  },
  autoAdvance: false,
  qualityThresholds: {
    minSatisfaction: 4.0,
    maxErrorRate: 5,
    minSuccessRate: 90,
  },
};

export class WorkflowEngine {
  private workflows: Map<string, AvatarWorkflow> = new Map();
  private validationEngine: ValidationEngine;
  private config: WorkflowConfig;

  constructor(config: Partial<WorkflowConfig> = {}) {
    this.validationEngine = new ValidationEngine();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  generateWorkflowId(): string {
    return `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  initiateWorkflow(templateId: string, initiatedBy: string): AvatarWorkflow {
    const workflow: AvatarWorkflow = {
      metadata: {
        workflowId: this.generateWorkflowId(),
        avatarTemplateId: templateId,
        initiatedBy,
        initiatedAt: new Date(),
        currentPhase: 'requirements',
        status: 'active',
      },
      phases: PHASE_ORDER.map((phase, index) => ({
        phase,
        status: index === 0 ? 'in-progress' : 'pending',
        owner: '',
        deliverables: [],
        notes: [],
      })),
      approvals: [],
      validations: [],
    };

    this.workflows.set(workflow.metadata.workflowId, workflow);
    return workflow;
  }

  getWorkflow(workflowId: string): AvatarWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  assignPhaseOwner(workflowId: string, phase: WorkflowPhase, owner: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    const phaseRecord = workflow.phases.find(p => p.phase === phase);
    if (!phaseRecord) return false;

    phaseRecord.owner = owner;
    return true;
  }

  startPhase(workflowId: string, phase: WorkflowPhase): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    const phaseRecord = workflow.phases.find(p => p.phase === phase);
    if (!phaseRecord || phaseRecord.status !== 'pending') return false;

    phaseRecord.status = 'in-progress';
    phaseRecord.startedAt = new Date();
    workflow.metadata.currentPhase = phase;

    return true;
  }

  completePhase(workflowId: string, phase: WorkflowPhase): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    const phaseRecord = workflow.phases.find(p => p.phase === phase);
    if (!phaseRecord || phaseRecord.status !== 'in-progress') return false;

    phaseRecord.status = 'completed';
    phaseRecord.completedAt = new Date();

    // Auto-advance to next phase if configured
    if (this.config.autoAdvance) {
      const currentIndex = PHASE_ORDER.indexOf(phase);
      if (currentIndex < PHASE_ORDER.length - 1) {
        this.startPhase(workflowId, PHASE_ORDER[currentIndex + 1]);
      }
    }

    return true;
  }

  requestApproval(
    workflowId: string,
    phase: WorkflowPhase,
    gateType: ApprovalRecord['gateType'] = 'phase-exit'
  ): ApprovalRecord | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const approval: ApprovalRecord = {
      id: `apr-${Date.now()}`,
      phase,
      gateType,
      requiredApprovers: this.config.requiredApprovers[phase] ?? [],
      approvals: [],
      status: 'pending',
      createdAt: new Date(),
    };

    workflow.approvals.push(approval);
    return approval;
  }

  submitApproval(
    workflowId: string,
    approvalId: string,
    approver: string,
    decision: ApprovalDecision['decision'],
    comments: string
  ): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    const approval = workflow.approvals.find(a => a.id === approvalId);
    if (!approval || approval.status !== 'pending') return false;

    approval.approvals.push({
      approver,
      decision,
      comments,
      timestamp: new Date(),
    });

    // Check if all required approvers have approved
    const allApproved = approval.requiredApprovers.every(req =>
      approval.approvals.some(a => a.approver === req && a.decision === 'approved')
    );

    const anyRejected = approval.approvals.some(a => a.decision === 'rejected');
    const anyRevision = approval.approvals.some(a => a.decision === 'revision-requested');

    if (allApproved) {
      approval.status = 'approved';
      approval.resolvedAt = new Date();
    } else if (anyRejected) {
      approval.status = 'rejected';
      approval.resolvedAt = new Date();
    } else if (anyRevision) {
      approval.status = 'revision-requested';
    }

    return true;
  }

  runValidation(workflowId: string, template: BaseAvatarTemplate): ValidationRecord[] {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return [];

    const validations = this.validationEngine.validateAll(template, workflow.metadata.currentPhase);
    workflow.validations.push(...validations);

    return validations;
  }

  startTrial(workflowId: string): TrialPeriod | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const trialPhase = workflow.phases.find(p => p.phase === 'trial');
    if (!trialPhase || trialPhase.status !== 'in-progress') return null;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + this.config.trialDays);

    workflow.trial = {
      startDate,
      endDate,
      status: 'active',
      metrics: {
        sessionsCount: 0,
        avgResponseTime: 0,
        satisfactionScore: 0,
        successRate: 0,
        errorRate: 0,
        escalationRate: 0,
      },
      feedback: [],
      checkpoints: [],
    };

    return workflow.trial;
  }

  updateTrialMetrics(workflowId: string, metrics: Partial<TrialMetrics>): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow?.trial) return false;

    workflow.trial.metrics = {
      ...workflow.trial.metrics,
      ...metrics,
    };

    return true;
  }

  addTrialFeedback(workflowId: string, feedback: Omit<TrialFeedback, 'id' | 'timestamp'>): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow?.trial) return false;

    workflow.trial.feedback.push({
      id: `fb-${Date.now()}`,
      ...feedback,
      timestamp: new Date(),
    });

    return true;
  }

  createTrialCheckpoint(workflowId: string, day: number, notes: string[] = []): TrialCheckpoint | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow?.trial) return null;

    const metrics = { ...workflow.trial.metrics };
    const { qualityThresholds } = this.config;

    let status: TrialCheckpoint['status'];
    if (
      metrics.satisfactionScore >= qualityThresholds.minSatisfaction &&
      metrics.errorRate <= qualityThresholds.maxErrorRate &&
      metrics.successRate >= qualityThresholds.minSuccessRate
    ) {
      status = 'on-track';
    } else if (
      metrics.satisfactionScore >= qualityThresholds.minSatisfaction * 0.9 &&
      metrics.errorRate <= qualityThresholds.maxErrorRate * 1.2 &&
      metrics.successRate >= qualityThresholds.minSuccessRate * 0.95
    ) {
      status = 'at-risk';
    } else {
      status = 'failing';
    }

    const checkpoint: TrialCheckpoint = {
      day,
      date: new Date(),
      metricsSnapshot: metrics,
      status,
      notes,
    };

    workflow.trial.checkpoints.push(checkpoint);
    return checkpoint;
  }

  completeTrial(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow?.trial) return false;

    workflow.trial.status = 'completed';
    return true;
  }

  makeAdoptionDecision(
    workflowId: string,
    decision: FinalStatus['decision'],
    decidedBy: string,
    conditions?: string[]
  ): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.finalStatus = {
      decision,
      decidedBy,
      decidedAt: new Date(),
      conditions,
    };

    if (decision === 'adopted') {
      workflow.metadata.status = 'completed';
      const adoptionPhase = workflow.phases.find(p => p.phase === 'adoption');
      if (adoptionPhase) {
        adoptionPhase.status = 'completed';
        adoptionPhase.completedAt = new Date();
      }
    } else if (decision === 'rejected') {
      workflow.metadata.status = 'cancelled';
    }

    return true;
  }

  cancelWorkflow(workflowId: string, reason: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.metadata.status = 'cancelled';
    const currentPhase = workflow.phases.find(p => p.phase === workflow.metadata.currentPhase);
    if (currentPhase) {
      currentPhase.status = 'failed';
      currentPhase.notes.push(`Cancelled: ${reason}`);
    }

    return true;
  }

  getWorkflowsByStatus(status: AvatarWorkflow['metadata']['status']): AvatarWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.metadata.status === status);
  }

  getWorkflowProgress(workflowId: string): { completed: number; total: number; percentage: number } {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return { completed: 0, total: 0, percentage: 0 };

    const total = workflow.phases.length;
    const completed = workflow.phases.filter(p => p.status === 'completed').length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  }
}
