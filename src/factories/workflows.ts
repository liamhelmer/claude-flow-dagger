import { SparcModule } from '../dagger/sparc.js';
import { SwarmModule } from '../dagger/swarm.js';
import { MemoryModule } from '../dagger/memory.js';
import { NeuralModule } from '../dagger/neural.js';
import { GitHubModule } from '../dagger/github.js';
import { UtilsModule } from '../dagger/utils.js';
import { 
  ClaudeFlowConfigType,
  TaskConfigType,
  CommandResult,
  BatchResult,
  AgentTypeType 
} from '../dagger/types.js';

/**
 * Workflow pipeline factory for creating complex development workflows
 */

export interface WorkflowPipeline {
  id: string;
  name: string;
  description: string;
  phases: WorkflowPhase[];
  execute(): Promise<WorkflowResult>;
  validate(): Promise<ValidationResult>;
  monitor(): Promise<MonitoringResult>;
}

export interface WorkflowPhase {
  id: string;
  name: string;
  dependencies: string[];
  tasks: TaskConfigType[];
  parallel: boolean;
  timeout?: number;
}

export interface WorkflowResult {
  success: boolean;
  duration: number;
  phases: PhaseResult[];
  artifacts: WorkflowArtifact[];
  metrics: WorkflowMetrics;
}

export interface PhaseResult {
  phaseId: string;
  success: boolean;
  duration: number;
  tasks: TaskConfigType[];
  results: BatchResult<unknown>;
}

export interface WorkflowArtifact {
  type: 'code' | 'documentation' | 'test' | 'configuration' | 'report';
  path: string;
  size: number;
  checksum: string;
}

export interface WorkflowMetrics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  resourceUtilization: number;
  qualityScore: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface MonitoringResult {
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentPhase: string;
  eta: number;
  metrics: Partial<WorkflowMetrics>;
}

/**
 * Implementation of WorkflowPipeline
 */
class WorkflowPipelineImpl implements WorkflowPipeline {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public phases: WorkflowPhase[],
    private modules: {
      sparc: SparcModule;
      swarm: SwarmModule;
      memory: MemoryModule;
      neural: NeuralModule;
      github?: GitHubModule;
      utils: UtilsModule;
    }
  ) {}

  async execute(): Promise<WorkflowResult> {
    const startTime = Date.now();
    const phaseResults: PhaseResult[] = [];
    const artifacts: WorkflowArtifact[] = [];
    
    // Store workflow start in memory
    await this.modules.memory.storeWorkflowState(this.id, 'started', {
      phaseResults: [],
      nextPhase: this.phases[0]?.id,
      context: { startTime, status: 'running' }
    });

    try {
      // Execute phases in dependency order
      const sortedPhases = this.topologicalSort(this.phases);
      
      for (const phase of sortedPhases) {
        const phaseStartTime = Date.now();
        
        // Store phase start
        await this.modules.memory.storeWorkflowState(this.id, phase.id, {
          phaseResults: [],
          context: { startTime: phaseStartTime, status: 'running' }
        });

        let phaseResult: PhaseResult;
        
        if (phase.parallel) {
          // Execute tasks in parallel
          const taskOperations = phase.tasks.map(task => 
            () => this.modules.swarm.orchestrateTask(task)
          );
          const results = await this.modules.utils.batch(taskOperations);
          
          phaseResult = {
            phaseId: phase.id,
            success: results.success,
            duration: Date.now() - phaseStartTime,
            tasks: phase.tasks,
            results: results as BatchResult<unknown>
          };
        } else {
          // Execute tasks sequentially
          const taskResults: CommandResult<unknown>[] = [];
          let phaseSuccess = true;
          
          for (const task of phase.tasks) {
            const result = await this.modules.swarm.orchestrateTask(task);
            taskResults.push(result as CommandResult<unknown>);
            if (!result.success) {
              phaseSuccess = false;
              break; // Stop on first failure in sequential execution
            }
          }
          
          phaseResult = {
            phaseId: phase.id,
            success: phaseSuccess,
            duration: Date.now() - phaseStartTime,
            tasks: phase.tasks,
            results: {
              results: taskResults,
              success: phaseSuccess,
              totalTasks: taskResults.length,
              successfulTasks: taskResults.filter(r => r.success).length,
              failedTasks: taskResults.filter(r => !r.success).length,
              duration: Date.now() - phaseStartTime
            }
          };
        }
        
        phaseResults.push(phaseResult);
        
        // Store phase completion
        await this.modules.memory.storeWorkflowState(this.id, phase.id, {
          phaseResults: [phaseResult],
          context: { 
            completedAt: Date.now(), 
            status: phaseResult.success ? 'completed' : 'failed' 
          }
        });

        // Stop if phase failed and it's not optional
        if (!phaseResult.success) {
          break;
        }
      }
      
      const duration = Date.now() - startTime;
      const totalTasks = phaseResults.reduce((sum, phase) => sum + phase.tasks.length, 0);
      const successfulTasks = phaseResults.reduce((sum, phase) => sum + phase.results.successfulTasks, 0);
      
      const result: WorkflowResult = {
        success: phaseResults.every(p => p.success),
        duration,
        phases: phaseResults,
        artifacts, // Would be populated by individual tasks
        metrics: {
          totalTasks,
          successfulTasks,
          failedTasks: totalTasks - successfulTasks,
          averageTaskDuration: duration / totalTasks,
          resourceUtilization: 0.8, // Would be calculated from actual metrics
          qualityScore: successfulTasks / totalTasks
        }
      };

      // Store final workflow state
      await this.modules.memory.storeWorkflowState(this.id, 'completed', {
        phaseResults,
        context: { 
          completedAt: Date.now(), 
          duration,
          status: result.success ? 'completed' : 'failed',
          metrics: result.metrics
        }
      });

      return result;
      
    } catch (error) {
      await this.modules.memory.storeWorkflowState(this.id, 'failed', {
        phaseResults,
        context: { 
          failedAt: Date.now(),
          error: error instanceof Error ? error.message : String(error),
          status: 'failed'
        }
      });
      
      throw error;
    }
  }

  async validate(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate phase dependencies
    const phaseIds = new Set(this.phases.map(p => p.id));
    for (const phase of this.phases) {
      for (const dep of phase.dependencies) {
        if (!phaseIds.has(dep)) {
          errors.push(`Phase '${phase.id}' depends on non-existent phase '${dep}'`);
        }
      }
    }

    // Check for circular dependencies
    if (this.hasCircularDependencies()) {
      errors.push('Workflow contains circular dependencies');
    }

    // Validate tasks
    for (const phase of this.phases) {
      for (const task of phase.tasks) {
        if (!task.id || !task.description) {
          errors.push(`Phase '${phase.id}' contains invalid task: missing id or description`);
        }
        
        if (!task.agent) {
          errors.push(`Task '${task.id}' in phase '${phase.id}' has no assigned agent`);
        }
      }
      
      // Warn about large parallel phases
      if (phase.parallel && phase.tasks.length > 10) {
        warnings.push(`Phase '${phase.id}' has ${phase.tasks.length} parallel tasks - consider breaking it down`);
      }
    }

    // Suggest optimizations
    if (this.phases.length > 20) {
      suggestions.push('Consider breaking down this workflow into smaller, composable workflows');
    }

    const isolatedPhases = this.phases.filter(p => p.dependencies.length === 0 && 
      !this.phases.some(other => other.dependencies.includes(p.id)));
    if (isolatedPhases.length > 1) {
      suggestions.push('Consider running isolated phases in parallel for better performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  async monitor(): Promise<MonitoringResult> {
    const workflowState = await this.modules.memory.retrieveWorkflowState(this.id);
    
    if (!workflowState.success || !workflowState.data) {
      return {
        status: 'failed',
        progress: 0,
        currentPhase: 'unknown',
        eta: 0,
        metrics: {}
      };
    }

    // Analyze workflow state from memory
    const states = workflowState.data;
    const completedPhases = states.filter(state => 
      state.value && (state.value as any).context?.status === 'completed'
    ).length;
    
    const totalPhases = this.phases.length;
    const progress = (completedPhases / totalPhases) * 100;
    
    const runningPhase = states.find(state => 
      state.value && (state.value as any).context?.status === 'running'
    );
    
    const currentPhase = runningPhase ? runningPhase.key.split(':').pop() || 'unknown' : 'completed';
    
    // Estimate remaining time based on completed phases
    const avgPhaseTime = states.reduce((sum, state) => {
      const ctx = (state.value as any)?.context;
      if (ctx?.completedAt && ctx?.startTime) {
        return sum + (ctx.completedAt - ctx.startTime);
      }
      return sum;
    }, 0) / Math.max(completedPhases, 1);
    
    const eta = (totalPhases - completedPhases) * avgPhaseTime;
    
    return {
      status: progress === 100 ? 'completed' : (runningPhase ? 'running' : 'failed'),
      progress,
      currentPhase,
      eta,
      metrics: {
        totalTasks: this.phases.reduce((sum, phase) => sum + phase.tasks.length, 0),
        successfulTasks: completedPhases * 2, // Rough estimate
      }
    };
  }

  private topologicalSort(phases: WorkflowPhase[]): WorkflowPhase[] {
    const visited = new Set<string>();
    const result: WorkflowPhase[] = [];
    const visiting = new Set<string>();

    const visit = (phaseId: string) => {
      if (visiting.has(phaseId)) {
        throw new Error(`Circular dependency detected involving phase: ${phaseId}`);
      }
      if (visited.has(phaseId)) {
        return;
      }

      visiting.add(phaseId);
      const phase = phases.find(p => p.id === phaseId);
      if (phase) {
        for (const dep of phase.dependencies) {
          visit(dep);
        }
        visited.add(phaseId);
        result.push(phase);
      }
      visiting.delete(phaseId);
    };

    for (const phase of phases) {
      if (!visited.has(phase.id)) {
        visit(phase.id);
      }
    }

    return result;
  }

  private hasCircularDependencies(): boolean {
    try {
      this.topologicalSort(this.phases);
      return false;
    } catch {
      return true;
    }
  }
}

/**
 * Create a workflow pipeline for full-stack development
 */
export async function createFullStackPipeline(
  modules: {
    sparc: SparcModule;
    swarm: SwarmModule;
    memory: MemoryModule;
    neural: NeuralModule;
    github?: GitHubModule;
    utils: UtilsModule;
  },
  options: {
    projectName: string;
    includeBackend?: boolean;
    includeFrontend?: boolean;
    includeDatabase?: boolean;
    includeMobile?: boolean;
    includeTests?: boolean;
    includeDocumentation?: boolean;
    includeDeploy?: boolean;
  }
): Promise<WorkflowPipeline> {
  const {
    projectName,
    includeBackend = true,
    includeFrontend = true,
    includeDatabase = true,
    includeMobile = false,
    includeTests = true,
    includeDocumentation = true,
    includeDeploy = false
  } = options;

  const phases: WorkflowPhase[] = [];

  // Phase 1: Project Planning and Architecture
  phases.push({
    id: 'planning',
    name: 'Project Planning & Architecture',
    dependencies: [],
    parallel: true,
    tasks: [
      {
        id: 'requirements-analysis',
        description: `Analyze requirements for ${projectName}`,
        agent: 'researcher',
        priority: 'high',
        timeout: 300000,
        retries: 2,
        dependencies: [],
        metadata: { phase: 'planning' }
      },
      {
        id: 'system-architecture',
        description: `Design system architecture for ${projectName}`,
        agent: 'system-architect',
        priority: 'high',
        timeout: 300000,
        retries: 2,
        dependencies: [],
        metadata: { phase: 'planning' }
      }
    ]
  });

  // Phase 2: Database Design (if included)
  if (includeDatabase) {
    phases.push({
      id: 'database',
      name: 'Database Design',
      dependencies: ['planning'],
      parallel: false,
      tasks: [
        {
          id: 'database-schema',
          description: `Design database schema for ${projectName}`,
          agent: 'code-analyzer',
          priority: 'high',
          timeout: 300000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'database' }
        },
        {
          id: 'database-migrations',
          description: `Create database migrations for ${projectName}`,
          agent: 'backend-dev',
          priority: 'medium',
          timeout: 180000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'database' }
        }
      ]
    });
  }

  // Phase 3: Backend Development (if included)
  if (includeBackend) {
    phases.push({
      id: 'backend',
      name: 'Backend Development',
      dependencies: includeDatabase ? ['database'] : ['planning'],
      parallel: true,
      tasks: [
        {
          id: 'api-design',
          description: `Design REST API for ${projectName}`,
          agent: 'api-docs',
          priority: 'high',
          timeout: 300000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'backend' }
        },
        {
          id: 'backend-implementation',
          description: `Implement backend services for ${projectName}`,
          agent: 'backend-dev',
          priority: 'high',
          timeout: 600000,
          retries: 3,
          dependencies: [],
          metadata: { phase: 'backend' }
        },
        {
          id: 'authentication',
          description: `Implement authentication system for ${projectName}`,
          agent: 'security-manager',
          priority: 'high',
          timeout: 300000,
          retries: 3,
          dependencies: [],
          metadata: { phase: 'backend' }
        }
      ]
    });
  }

  // Phase 4: Frontend Development (if included)
  if (includeFrontend) {
    phases.push({
      id: 'frontend',
      name: 'Frontend Development',
      dependencies: includeBackend ? ['backend'] : ['planning'],
      parallel: true,
      tasks: [
        {
          id: 'ui-design',
          description: `Design user interface for ${projectName}`,
          agent: 'coder',
          priority: 'high',
          timeout: 300000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'frontend' }
        },
        {
          id: 'frontend-implementation',
          description: `Implement frontend application for ${projectName}`,
          agent: 'coder',
          priority: 'high',
          timeout: 600000,
          retries: 3,
          dependencies: [],
          metadata: { phase: 'frontend' }
        },
        {
          id: 'state-management',
          description: `Implement state management for ${projectName}`,
          agent: 'coder',
          priority: 'medium',
          timeout: 300000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'frontend' }
        }
      ]
    });
  }

  // Phase 5: Mobile Development (if included)
  if (includeMobile) {
    phases.push({
      id: 'mobile',
      name: 'Mobile Development',
      dependencies: includeBackend ? ['backend'] : ['planning'],
      parallel: true,
      tasks: [
        {
          id: 'mobile-app',
          description: `Develop mobile app for ${projectName}`,
          agent: 'mobile-dev',
          priority: 'medium',
          timeout: 900000,
          retries: 3,
          dependencies: [],
          metadata: { phase: 'mobile' }
        }
      ]
    });
  }

  // Phase 6: Testing (if included)
  if (includeTests) {
    const testDependencies = [];
    if (includeBackend) testDependencies.push('backend');
    if (includeFrontend) testDependencies.push('frontend');
    if (includeMobile) testDependencies.push('mobile');
    if (testDependencies.length === 0) testDependencies.push('planning');

    phases.push({
      id: 'testing',
      name: 'Testing & Quality Assurance',
      dependencies: testDependencies,
      parallel: true,
      tasks: [
        {
          id: 'unit-tests',
          description: `Create unit tests for ${projectName}`,
          agent: 'tester',
          priority: 'high',
          timeout: 300000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'testing' }
        },
        {
          id: 'integration-tests',
          description: `Create integration tests for ${projectName}`,
          agent: 'tester',
          priority: 'high',
          timeout: 400000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'testing' }
        },
        {
          id: 'e2e-tests',
          description: `Create end-to-end tests for ${projectName}`,
          agent: 'tester',
          priority: 'medium',
          timeout: 500000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'testing' }
        },
        {
          id: 'performance-tests',
          description: `Create performance tests for ${projectName}`,
          agent: 'perf-analyzer',
          priority: 'medium',
          timeout: 300000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'testing' }
        }
      ]
    });
  }

  // Phase 7: Documentation (if included)
  if (includeDocumentation) {
    const docDependencies = [];
    if (includeBackend) docDependencies.push('backend');
    if (includeFrontend) docDependencies.push('frontend');
    if (includeMobile) docDependencies.push('mobile');
    if (includeTests) docDependencies.push('testing');
    if (docDependencies.length === 0) docDependencies.push('planning');

    phases.push({
      id: 'documentation',
      name: 'Documentation',
      dependencies: docDependencies,
      parallel: true,
      tasks: [
        {
          id: 'api-documentation',
          description: `Generate API documentation for ${projectName}`,
          agent: 'api-docs',
          priority: 'medium',
          timeout: 180000,
          retries: 1,
          dependencies: [],
          metadata: { phase: 'documentation' }
        },
        {
          id: 'user-documentation',
          description: `Create user documentation for ${projectName}`,
          agent: 'coder',
          priority: 'medium',
          timeout: 240000,
          retries: 1,
          dependencies: [],
          metadata: { phase: 'documentation' }
        }
      ]
    });
  }

  // Phase 8: Deployment (if included)
  if (includeDeploy) {
    const deployDependencies = ['testing'];
    if (includeDocumentation) deployDependencies.push('documentation');

    phases.push({
      id: 'deployment',
      name: 'Deployment & CI/CD',
      dependencies: deployDependencies,
      parallel: false,
      tasks: [
        {
          id: 'cicd-pipeline',
          description: `Setup CI/CD pipeline for ${projectName}`,
          agent: 'cicd-engineer',
          priority: 'high',
          timeout: 300000,
          retries: 3,
          dependencies: [],
          metadata: { phase: 'deployment' }
        },
        {
          id: 'production-deploy',
          description: `Deploy ${projectName} to production`,
          agent: 'cicd-engineer',
          priority: 'critical',
          timeout: 600000,
          retries: 5,
          dependencies: [],
          metadata: { phase: 'deployment' }
        }
      ]
    });
  }

  return new WorkflowPipelineImpl(
    `fullstack-${projectName.toLowerCase().replace(/\s+/g, '-')}`,
    `Full-Stack Development: ${projectName}`,
    `Complete full-stack development workflow for ${projectName}`,
    phases,
    modules
  );
}

/**
 * Create a workflow pipeline for machine learning projects
 */
export async function createMLPipeline(
  modules: {
    sparc: SparcModule;
    swarm: SwarmModule;
    memory: MemoryModule;
    neural: NeuralModule;
    github?: GitHubModule;
    utils: UtilsModule;
  },
  options: {
    projectName: string;
    modelType: 'classification' | 'regression' | 'clustering' | 'reinforcement';
    includeDataProcessing?: boolean;
    includeFeatureEngineering?: boolean;
    includeModelValidation?: boolean;
    includeDeployment?: boolean;
  }
): Promise<WorkflowPipeline> {
  const {
    projectName,
    modelType,
    includeDataProcessing = true,
    includeFeatureEngineering = true,
    includeModelValidation = true,
    includeDeployment = false
  } = options;

  const phases: WorkflowPhase[] = [
    {
      id: 'data-analysis',
      name: 'Data Analysis & Preparation',
      dependencies: [],
      parallel: false,
      tasks: [
        {
          id: 'data-exploration',
          description: `Explore and analyze data for ${projectName}`,
          agent: 'ml-developer',
          priority: 'high',
          timeout: 300000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'data-analysis', modelType }
        }
      ]
    }
  ];

  if (includeDataProcessing) {
    phases.push({
      id: 'data-processing',
      name: 'Data Processing',
      dependencies: ['data-analysis'],
      parallel: true,
      tasks: [
        {
          id: 'data-cleaning',
          description: `Clean and preprocess data for ${projectName}`,
          agent: 'ml-developer',
          priority: 'high',
          timeout: 400000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'data-processing' }
        },
        {
          id: 'data-validation',
          description: `Validate data quality for ${projectName}`,
          agent: 'tester',
          priority: 'high',
          timeout: 200000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'data-processing' }
        }
      ]
    });
  }

  if (includeFeatureEngineering) {
    phases.push({
      id: 'feature-engineering',
      name: 'Feature Engineering',
      dependencies: includeDataProcessing ? ['data-processing'] : ['data-analysis'],
      parallel: false,
      tasks: [
        {
          id: 'feature-selection',
          description: `Engineer features for ${projectName}`,
          agent: 'ml-developer',
          priority: 'high',
          timeout: 600000,
          retries: 3,
          dependencies: [],
          metadata: { phase: 'feature-engineering', modelType }
        }
      ]
    });
  }

  // Model Training Phase
  phases.push({
    id: 'model-training',
    name: 'Model Training & Optimization',
    dependencies: includeFeatureEngineering ? ['feature-engineering'] : 
                  (includeDataProcessing ? ['data-processing'] : ['data-analysis']),
    parallel: true,
    tasks: [
      {
        id: 'model-training',
        description: `Train ${modelType} model for ${projectName}`,
        agent: 'ml-developer',
        priority: 'critical',
        timeout: 1200000, // 20 minutes for training
        retries: 3,
        dependencies: [],
        metadata: { phase: 'model-training', modelType }
      },
      {
        id: 'hyperparameter-tuning',
        description: `Optimize hyperparameters for ${projectName}`,
        agent: 'perf-analyzer',
        priority: 'high',
        timeout: 900000,
        retries: 2,
        dependencies: [],
        metadata: { phase: 'model-training' }
      }
    ]
  });

  if (includeModelValidation) {
    phases.push({
      id: 'validation',
      name: 'Model Validation & Testing',
      dependencies: ['model-training'],
      parallel: true,
      tasks: [
        {
          id: 'model-validation',
          description: `Validate model performance for ${projectName}`,
          agent: 'tester',
          priority: 'high',
          timeout: 300000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'validation' }
        },
        {
          id: 'performance-analysis',
          description: `Analyze model performance metrics for ${projectName}`,
          agent: 'perf-analyzer',
          priority: 'high',
          timeout: 200000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'validation' }
        }
      ]
    });
  }

  if (includeDeployment) {
    phases.push({
      id: 'deployment',
      name: 'Model Deployment',
      dependencies: includeModelValidation ? ['validation'] : ['model-training'],
      parallel: false,
      tasks: [
        {
          id: 'model-packaging',
          description: `Package model for deployment: ${projectName}`,
          agent: 'cicd-engineer',
          priority: 'high',
          timeout: 300000,
          retries: 2,
          dependencies: [],
          metadata: { phase: 'deployment' }
        },
        {
          id: 'model-deployment',
          description: `Deploy model to production: ${projectName}`,
          agent: 'cicd-engineer',
          priority: 'critical',
          timeout: 600000,
          retries: 3,
          dependencies: [],
          metadata: { phase: 'deployment' }
        }
      ]
    });
  }

  return new WorkflowPipelineImpl(
    `ml-${projectName.toLowerCase().replace(/\s+/g, '-')}`,
    `ML Pipeline: ${projectName}`,
    `Complete machine learning workflow for ${projectName} (${modelType})`,
    phases,
    modules
  );
}

/**
 * Create a workflow pipeline for automated code review
 */
export async function createCodeReviewPipeline(
  modules: {
    sparc: SparcModule;
    swarm: SwarmModule;
    memory: MemoryModule;
    neural: NeuralModule;
    github?: GitHubModule;
    utils: UtilsModule;
  },
  options: {
    repositoryUrl: string;
    prNumber?: number;
    reviewDepth: 'basic' | 'comprehensive' | 'security-focused';
  }
): Promise<WorkflowPipeline> {
  const { repositoryUrl, prNumber, reviewDepth } = options;

  const phases: WorkflowPhase[] = [
    {
      id: 'code-analysis',
      name: 'Code Analysis',
      dependencies: [],
      parallel: true,
      tasks: [
        {
          id: 'static-analysis',
          description: `Perform static code analysis on ${repositoryUrl}`,
          agent: 'code-analyzer',
          priority: 'high',
          timeout: 300000,
          retries: 2,
          dependencies: [],
          metadata: { repository: repositoryUrl, pr: prNumber }
        },
        {
          id: 'complexity-analysis',
          description: `Analyze code complexity for ${repositoryUrl}`,
          agent: 'perf-analyzer',
          priority: 'medium',
          timeout: 200000,
          retries: 2,
          dependencies: [],
          metadata: { repository: repositoryUrl }
        }
      ]
    },
    {
      id: 'quality-review',
      name: 'Quality Review',
      dependencies: ['code-analysis'],
      parallel: true,
      tasks: [
        {
          id: 'code-quality',
          description: `Review code quality for ${repositoryUrl}`,
          agent: 'reviewer',
          priority: 'high',
          timeout: 400000,
          retries: 2,
          dependencies: [],
          metadata: { repository: repositoryUrl, reviewType: 'quality' }
        },
        {
          id: 'test-coverage',
          description: `Analyze test coverage for ${repositoryUrl}`,
          agent: 'tester',
          priority: 'medium',
          timeout: 200000,
          retries: 2,
          dependencies: [],
          metadata: { repository: repositoryUrl }
        }
      ]
    }
  ];

  if (reviewDepth === 'comprehensive' || reviewDepth === 'security-focused') {
    phases.push({
      id: 'security-review',
      name: 'Security Review',
      dependencies: ['quality-review'],
      parallel: true,
      tasks: [
        {
          id: 'security-scan',
          description: `Perform security scan on ${repositoryUrl}`,
          agent: 'security-manager',
          priority: 'critical',
          timeout: 600000,
          retries: 3,
          dependencies: [],
          metadata: { repository: repositoryUrl, scanType: 'comprehensive' }
        },
        {
          id: 'dependency-audit',
          description: `Audit dependencies for ${repositoryUrl}`,
          agent: 'security-manager',
          priority: 'high',
          timeout: 300000,
          retries: 2,
          dependencies: [],
          metadata: { repository: repositoryUrl }
        }
      ]
    });
  }

  const reportDependencies = reviewDepth === 'security-focused' || reviewDepth === 'comprehensive' 
    ? ['security-review'] 
    : ['quality-review'];

  phases.push({
    id: 'report-generation',
    name: 'Report Generation',
    dependencies: reportDependencies,
    parallel: false,
    tasks: [
      {
        id: 'generate-report',
        description: `Generate review report for ${repositoryUrl}`,
        agent: 'reviewer',
        priority: 'medium',
        timeout: 180000,
        retries: 1,
        dependencies: [],
        metadata: { repository: repositoryUrl, reportType: reviewDepth }
      }
    ]
  });

  return new WorkflowPipelineImpl(
    `review-${repositoryUrl.split('/').pop() || 'repo'}-${Date.now()}`,
    `Code Review: ${repositoryUrl}`,
    `Automated code review pipeline for ${repositoryUrl} (${reviewDepth})`,
    phases,
    modules
  );
}

/**
 * Workflow pipeline factory - main export
 */
export const WorkflowFactory = {
  createFullStackPipeline,
  createMLPipeline,
  createCodeReviewPipeline,
  
  /**
   * Create a custom workflow from configuration
   */
  createCustomWorkflow: (
    modules: {
      sparc: SparcModule;
      swarm: SwarmModule;
      memory: MemoryModule;
      neural: NeuralModule;
      github?: GitHubModule;
      utils: UtilsModule;
    },
    config: {
      id: string;
      name: string;
      description: string;
      phases: WorkflowPhase[];
    }
  ): WorkflowPipeline => {
    return new WorkflowPipelineImpl(
      config.id,
      config.name,
      config.description,
      config.phases,
      modules
    );
  }
};