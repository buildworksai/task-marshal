/**
 * Enhanced Types for Task-Marshal 1.1.0
 * BuildWorks.AI - Initiative-based filesystem storage
 */

import { Task as BaseTask } from './index.js';

export interface Subtask {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignee?: string;
  dueDate?: Date;
  insightCards?: string[];
  narrativeContext?: string;
  aiSignals?: string[];
  metadata: Record<string, unknown>;
}

export interface Task extends BaseTask {
  initiativeId: string;
  parentTaskId?: string;
  subtasks: Subtask[];
  governanceState: string;
  visualPriority: number;
  insightCards: string[];
  narrativeContext: string;
  aiSignals: string[];
}

export interface Initiative {
  id: string;
  name: string;
  description?: string;
  owner: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: string;
  metadata: Record<string, unknown>;
}

export interface DependencyContract {
  from: string;
  to: string;
  relationshipType: 'blocks' | 'depends-on' | 'follows';
  sla?: {
    targetDate: Date;
    toleranceHours: number;
  };
  risk?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    mitigationPlan: string;
    impactVector: string[];
  };
  autonomy: {
    requiresManualApproval: boolean;
    escalationContact?: string;
  };
}

export interface GovernanceRule {
  id: string;
  name: string;
  description: string;
  appliesTo: 'task' | 'subtask';
  conditions: Record<string, unknown>;
  actions: string[];
  enabled: boolean;
}
