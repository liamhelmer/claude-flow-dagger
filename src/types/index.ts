/**
 * Type definitions for Claude Flow Dagger module
 */

import { z } from 'zod';

// SPARC Modes
export const SparcModeSchema = z.enum([
  'specification',
  'pseudocode',
  'architecture',
  'refinement',
  'completion',
  'spec-pseudocode',
  'architect',
  'integration',
  'tdd',
  'backend',
  'mobile',
  'ml',
  'cicd',
  'api',
  'security',
  'fullstack'
]);

export type SparcMode = z.infer<typeof SparcModeSchema>;

// Swarm Topologies
export const SwarmTopologySchema = z.enum([
  'mesh',
  'hierarchical',
  'adaptive',
  'byzantine',
  'raft',
  'gossip',
  'collective',
  'neural'
]);

export type SwarmTopology = z.infer<typeof SwarmTopologySchema>;

// Agent Types (54 types)
export const AgentTypeSchema = z.enum([
  'general-purpose',
  'statusline-setup',
  'output-style-setup',
  'refinement',
  'pseudocode',
  'architecture',
  'specification',
  'adaptive-coordinator',
  'mesh-coordinator',
  'hierarchical-coordinator',
  'ml-developer',
  'base-template-generator',
  'code-analyzer',
  'byzantine-coordinator',
  'swarm-init',
  'smart-agent',
  'sparc-coord',
  'pr-manager',
  'perf-analyzer',
  'task-orchestrator',
  'sparc-coder',
  'memory-coordinator',
  'migration-planner',
  'gossip-coordinator',
  'performance-benchmarker',
  'raft-manager',
  'crdt-synchronizer',
  'security-manager',
  'quorum-manager',
  'repo-architect',
  'issue-tracker',
  'project-board-sync',
  'github-modes',
  'code-review-swarm',
  'workflow-automation',
  'multi-repo-swarm',
  'sync-coordinator',
  'release-swarm',
  'release-manager',
  'swarm-pr',
  'swarm-issue',
  'cicd-engineer',
  'coder',
  'planner',
  'tester',
  'researcher',
  'reviewer',
  'system-architect',
  'backend-dev',
  'api-docs',
  'tdd-london-swarm',
  'production-validator',
  'mobile-dev'
]);

export type AgentType = z.infer<typeof AgentTypeSchema>;

// Task Configuration
export const TaskConfigSchema = z.object({
  id: z.string(),
  description: z.string(),
  agents: z.array(AgentTypeSchema).optional(),
  dependencies: z.array(z.string()).optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
  parallel: z.boolean().optional()
});

export type TaskConfig = z.infer<typeof TaskConfigSchema>;

// Swarm Configuration
export const SwarmConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  topology: SwarmTopologySchema,
  objective: z.string(),
  agents: z.record(AgentTypeSchema, z.number()),
  queenType: z.enum(['strategic', 'tactical', 'adaptive']).optional(),
  consensus: z.enum(['majority', 'unanimous', 'weighted']).optional(),
  maxAgents: z.number().default(10),
  autoScale: z.boolean().default(false)
});

export type SwarmConfig = z.infer<typeof SwarmConfigSchema>;

// Memory Configuration
export const MemoryConfigSchema = z.object({
  provider: z.enum(['redis', 'postgresql', 'memory', 'file']),
  connectionUrl: z.string().optional(),
  ttl: z.number().optional(),
  maxSize: z.string().optional(),
  compression: z.boolean().default(false),
  encryption: z.boolean().default(false)
});

export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;

// Neural Configuration
export const NeuralConfigSchema = z.object({
  modelType: z.enum(['classifier', 'predictor', 'optimizer', 'analyzer']),
  trainingData: z.array(z.any()).optional(),
  epochs: z.number().default(100),
  learningRate: z.number().default(0.01),
  batchSize: z.number().default(32),
  validationSplit: z.number().default(0.2)
});

export type NeuralConfig = z.infer<typeof NeuralConfigSchema>;

// GitHub Configuration
export const GitHubConfigSchema = z.object({
  token: z.string(),
  owner: z.string(),
  repo: z.string(),
  branch: z.string().default('main'),
  autoMerge: z.boolean().default(false),
  requireReviews: z.number().default(1)
});

export type GitHubConfig = z.infer<typeof GitHubConfigSchema>;

// Workflow Configuration
export const WorkflowConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  phases: z.array(z.object({
    name: z.string(),
    mode: SparcModeSchema.optional(),
    tasks: z.array(TaskConfigSchema),
    parallel: z.boolean().default(false)
  })),
  dependencies: z.record(z.string(), z.array(z.string())).optional(),
  onSuccess: z.function().optional(),
  onFailure: z.function().optional()
});

export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;

// Result Types
export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SwarmResult {
  swarmId: string;
  status: 'running' | 'completed' | 'failed';
  agents: Array<{
    id: string;
    type: AgentType;
    status: string;
    tasks: number;
  }>;
  results?: any[];
}

export interface MemoryEntry {
  key: string;
  value: any;
  timestamp: Date;
  ttl?: number;
  metadata?: Record<string, any>;
}

export interface NeuralPrediction {
  confidence: number;
  prediction: any;
  features: Record<string, any>;
  model: string;
}

// Environment Types
export const EnvironmentSchema = z.enum([
  'development',
  'staging',
  'production',
  'testing',
  'ci',
  'local'
]);

export type Environment = z.infer<typeof EnvironmentSchema>;

// Configuration Presets
export interface ConfigPreset {
  name: string;
  description: string;
  config: Partial<ClaudeFlowConfig>;
}

// Main Configuration
export interface ClaudeFlowConfig {
  apiKey?: string;
  environment: Environment;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    destination: 'console' | 'file' | 'both';
  };
  docker?: {
    registry?: string;
    namespace?: string;
    tag?: string;
  };
  memory?: MemoryConfig;
  github?: Partial<GitHubConfig>;
  features?: {
    sparc?: boolean;
    swarm?: boolean;
    neural?: boolean;
    memory?: boolean;
    github?: boolean;
  };
}