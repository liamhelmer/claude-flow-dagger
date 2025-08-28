import { z } from 'zod';

// Base Types
export const SparceMode = z.enum([
  'spec-pseudocode',
  'architect',
  'integration',
  'backend-dev',
  'mobile-dev',
  'ml-developer',
  'cicd-engineer',
  'api-docs',
  'system-architect',
  'code-analyzer',
  'base-template-generator'
]);

export const AgentType = z.enum([
  'coder',
  'reviewer', 
  'tester',
  'planner',
  'researcher',
  'hierarchical-coordinator',
  'mesh-coordinator',
  'adaptive-coordinator',
  'collective-intelligence-coordinator',
  'swarm-memory-manager',
  'byzantine-coordinator',
  'raft-manager',
  'gossip-coordinator',
  'consensus-builder',
  'crdt-synchronizer',
  'quorum-manager',
  'security-manager',
  'perf-analyzer',
  'performance-benchmarker',
  'task-orchestrator',
  'memory-coordinator',
  'smart-agent',
  'github-modes',
  'pr-manager',
  'code-review-swarm',
  'issue-tracker',
  'release-manager',
  'workflow-automation',
  'project-board-sync',
  'repo-architect',
  'multi-repo-swarm',
  'sparc-coord',
  'sparc-coder',
  'specification',
  'pseudocode',
  'architecture',
  'refinement',
  'backend-dev',
  'mobile-dev',
  'ml-developer',
  'cicd-engineer',
  'api-docs',
  'system-architect',
  'code-analyzer',
  'base-template-generator',
  'tdd-london-swarm',
  'production-validator',
  'migration-planner',
  'swarm-init'
]);

export const SwarmTopology = z.enum(['mesh', 'hierarchical', 'star', 'ring', 'adaptive']);

// Configuration Schemas
export const ClaudeFlowConfig = z.object({
  apiKey: z.string().optional(),
  modelName: z.string().default('claude-3-sonnet-20240229'),
  maxTokens: z.number().default(4096),
  temperature: z.number().min(0).max(1).default(0.7),
  timeout: z.number().default(300000),
  retries: z.number().default(3),
  baseUrl: z.string().url().optional(),
  enableHooks: z.boolean().default(true),
  enableMemory: z.boolean().default(true),
  enableNeural: z.boolean().default(true),
});

export const SwarmConfig = z.object({
  topology: SwarmTopology,
  maxAgents: z.number().min(1).max(50).default(10),
  sessionId: z.string().optional(),
  enableMetrics: z.boolean().default(true),
  autoHeal: z.boolean().default(true),
  parallelTasks: z.number().min(1).max(20).default(5),
});

export const TaskConfig = z.object({
  id: z.string(),
  description: z.string(),
  agent: AgentType,
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  timeout: z.number().default(300000),
  retries: z.number().default(2),
  dependencies: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export const MemoryConfig = z.object({
  provider: z.enum(['local', 'redis', 'mongodb']).default('local'),
  namespace: z.string().default('claude-flow'),
  ttl: z.number().default(86400), // 24 hours
  maxSize: z.number().default(1000),
  enableCompression: z.boolean().default(true),
});

export const GitHubConfig = z.object({
  token: z.string(),
  owner: z.string(),
  repo: z.string(),
  baseBranch: z.string().default('main'),
  enableWebhooks: z.boolean().default(false),
  enableActions: z.boolean().default(true),
});

// Response Types
export const TaskResult = z.object({
  taskId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  result: z.unknown().optional(),
  error: z.string().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const SwarmStatus = z.object({
  sessionId: z.string(),
  topology: SwarmTopology,
  activeAgents: z.number(),
  runningTasks: z.number(),
  completedTasks: z.number(),
  failedTasks: z.number(),
  uptime: z.number(),
  metrics: z.record(z.unknown()).default({}),
});

export const MemoryEntry = z.object({
  key: z.string(),
  value: z.unknown(),
  timestamp: z.string(),
  ttl: z.number().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const NeuralStatus = z.object({
  models: z.array(z.object({
    name: z.string(),
    status: z.enum(['training', 'ready', 'error']),
    accuracy: z.number().optional(),
    lastTrained: z.string().optional(),
  })),
  patterns: z.array(z.object({
    pattern: z.string(),
    confidence: z.number(),
    usage: z.number(),
  })),
  totalTrainingData: z.number(),
});

// Type exports
export type SpareModeType = z.infer<typeof SparceMode>;
export type AgentTypeType = z.infer<typeof AgentType>;
export type SwarmTopologyType = z.infer<typeof SwarmTopology>;
export type ClaudeFlowConfigType = z.infer<typeof ClaudeFlowConfig>;
export type SwarmConfigType = z.infer<typeof SwarmConfig>;
export type TaskConfigType = z.infer<typeof TaskConfig>;
export type MemoryConfigType = z.infer<typeof MemoryConfig>;
export type GitHubConfigType = z.infer<typeof GitHubConfig>;
export type TaskResultType = z.infer<typeof TaskResult>;
export type SwarmStatusType = z.infer<typeof SwarmStatus>;
export type MemoryEntryType = z.infer<typeof MemoryEntry>;
export type NeuralStatusType = z.infer<typeof NeuralStatus>;

// Command result types
export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

export interface BatchResult<T = unknown> {
  results: CommandResult<T>[];
  success: boolean;
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  duration: number;
}