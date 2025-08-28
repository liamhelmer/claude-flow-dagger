import { ClaudeFlowDagger } from '../dagger/core.js';
import { SparcModule } from '../dagger/sparc.js';
import { SwarmModule } from '../dagger/swarm.js';
import { MemoryModule } from '../dagger/memory.js';
import { NeuralModule } from '../dagger/neural.js';
import { GitHubModule } from '../dagger/github.js';
import { UtilsModule } from '../dagger/utils.js';
import { 
  ClaudeFlowConfigType,
  SwarmConfigType,
  MemoryConfigType,
  GitHubConfigType,
  CommandResult,
  BatchResult 
} from '../dagger/types.js';
import { ConfigPresets } from '../config/index.js';

/**
 * Environment factory functions for common development scenarios
 */

export interface Environment {
  core: ClaudeFlowDagger;
  sparc: SparcModule;
  swarm: SwarmModule;
  memory: MemoryModule;
  neural: NeuralModule;
  github?: GitHubModule;
  utils: UtilsModule;
}

/**
 * Create a complete development environment with all modules configured
 */
export async function createDevelopmentEnvironment(options: {
  claudeConfig?: Partial<ClaudeFlowConfigType>;
  swarmConfig?: Partial<SwarmConfigType>;
  memoryConfig?: Partial<MemoryConfigType>;
  githubConfig?: GitHubConfigType;
  workingDirectory?: string;
  initializeServices?: boolean;
} = {}): Promise<{
  environment: Environment;
  initResults?: BatchResult<string>;
}> {
  const {
    claudeConfig = {},
    swarmConfig = {},
    memoryConfig = {},
    githubConfig,
    workingDirectory = '/workspace',
    initializeServices = true
  } = options;

  // Merge with development presets
  const finalClaudeConfig = { ...ConfigPresets.development(), ...claudeConfig };
  const finalSwarmConfig = { ...ConfigPresets.highPerformanceSwarm(), ...swarmConfig };
  const finalMemoryConfig = { ...ConfigPresets.memoryOptimized(), ...memoryConfig };

  // Create all modules
  const core = new ClaudeFlowDagger(finalClaudeConfig, workingDirectory);
  const sparc = new SparcModule(finalClaudeConfig, workingDirectory);
  const swarm = new SwarmModule(finalClaudeConfig, workingDirectory);
  const memory = new MemoryModule(finalClaudeConfig, workingDirectory);
  const neural = new NeuralModule(finalClaudeConfig, workingDirectory);
  const utils = new UtilsModule(finalClaudeConfig, workingDirectory);
  
  let github: GitHubModule | undefined;
  if (githubConfig) {
    github = new GitHubModule(finalClaudeConfig, workingDirectory);
  }

  const environment: Environment = {
    core,
    sparc,
    swarm,
    memory,
    neural,
    github,
    utils
  };

  let initResults: BatchResult<string> | undefined;

  if (initializeServices) {
    const initOperations: (() => Promise<CommandResult<string>>)[] = [
      () => sparc.initSparc(),
      () => swarm.initializeSwarm(finalSwarmConfig),
      () => memory.initializeMemory(finalMemoryConfig),
      () => neural.initializeNeural(),
    ];

    if (github && githubConfig) {
      initOperations.push(() => github!.setupGitHubIntegration(githubConfig));
    }

    initResults = await utils.batch(initOperations);
  }

  return { environment, initResults };
}

/**
 * Create an ML/AI focused environment with neural capabilities
 */
export async function createMLEnvironment(options: {
  claudeConfig?: Partial<ClaudeFlowConfigType>;
  workingDirectory?: string;
  modelTypes?: string[];
  enableDistributedTraining?: boolean;
} = {}): Promise<{
  environment: Environment;
  mlSetupResults: BatchResult<string>;
}> {
  const {
    claudeConfig = {},
    workingDirectory = '/workspace/ml',
    modelTypes = ['classification', 'regression', 'clustering'],
    enableDistributedTraining = true
  } = options;

  // ML-optimized configuration
  const finalConfig: ClaudeFlowConfigType = {
    ...ConfigPresets.production(),
    ...claudeConfig,
    maxTokens: 8192, // Higher token limit for ML tasks
    temperature: 0.3, // Lower temperature for consistent results
  };

  // Create specialized swarm for ML
  const mlSwarmConfig: SwarmConfigType = {
    topology: 'adaptive',
    maxAgents: 15,
    enableMetrics: true,
    autoHeal: true,
    parallelTasks: enableDistributedTraining ? 8 : 4,
  };

  // High-capacity memory for ML data
  const mlMemoryConfig: MemoryConfigType = {
    provider: 'local',
    namespace: 'claude-flow-ml',
    ttl: 172800, // 48 hours for ML data
    maxSize: 10000,
    enableCompression: true,
  };

  const core = new ClaudeFlowDagger(finalConfig, workingDirectory);
  const sparc = new SparcModule(finalConfig, workingDirectory);
  const swarm = new SwarmModule(finalConfig, workingDirectory);
  const memory = new MemoryModule(finalConfig, workingDirectory);
  const neural = new NeuralModule(finalConfig, workingDirectory);
  const utils = new UtilsModule(finalConfig, workingDirectory);

  const environment: Environment = {
    core,
    sparc,
    swarm,
    memory,
    neural,
    utils
  };

  // Initialize ML-specific services
  const mlSetupOperations: (() => Promise<CommandResult<string>>)[] = [
    () => memory.initializeMemory(mlMemoryConfig),
    () => neural.initializeNeural(),
    () => swarm.createMLTrainingSwarm().then(result => ({
      success: result.success,
      data: `ML Training Swarm: ${result.successfulTasks}/${result.totalTasks} agents spawned`,
      error: result.success ? undefined : 'Failed to create ML training swarm'
    })),
  ];

  // Create specialized models for each type
  for (const modelType of modelTypes) {
    mlSetupOperations.push(() => neural.exec(['neural', 'create-model', JSON.stringify({
      name: `default-${modelType}`,
      type: modelType,
      architecture: 'auto',
      trainingData: [],
      validationData: []
    })]));
  }

  const mlSetupResults = await utils.batch(mlSetupOperations);

  return { environment, mlSetupResults };
}

/**
 * Create a security-focused environment for code analysis and vulnerability assessment
 */
export async function createSecurityEnvironment(options: {
  claudeConfig?: Partial<ClaudeFlowConfigType>;
  githubConfig?: GitHubConfigType;
  workingDirectory?: string;
  enableContinuousScanning?: boolean;
} = {}): Promise<{
  environment: Environment;
  securitySetupResults: BatchResult<string>;
}> {
  const {
    claudeConfig = {},
    githubConfig,
    workingDirectory = '/workspace/security',
    enableContinuousScanning = true
  } = options;

  // Security-focused configuration
  const finalConfig: ClaudeFlowConfigType = {
    ...ConfigPresets.production(),
    ...claudeConfig,
    temperature: 0.1, // Very low temperature for consistent security analysis
    retries: 5, // More retries for critical security operations
  };

  // Hierarchical swarm for security chain of command
  const securitySwarmConfig: SwarmConfigType = {
    topology: 'hierarchical',
    maxAgents: 8,
    enableMetrics: true,
    autoHeal: false, // Manual healing for security environments
    parallelTasks: 3, // Limited parallelism for security control
  };

  // Secure memory configuration
  const securityMemoryConfig: MemoryConfigType = {
    provider: 'local',
    namespace: 'claude-flow-security',
    ttl: 43200, // 12 hours for security data
    maxSize: 2000,
    enableCompression: true,
  };

  const core = new ClaudeFlowDagger(finalConfig, workingDirectory);
  const sparc = new SparcModule(finalConfig, workingDirectory);
  const swarm = new SwarmModule(finalConfig, workingDirectory);
  const memory = new MemoryModule(finalConfig, workingDirectory);
  const neural = new NeuralModule(finalConfig, workingDirectory);
  const utils = new UtilsModule(finalConfig, workingDirectory);
  
  let github: GitHubModule | undefined;
  if (githubConfig) {
    github = new GitHubModule(finalConfig, workingDirectory);
  }

  const environment: Environment = {
    core,
    sparc,
    swarm,
    memory,
    neural,
    github,
    utils
  };

  // Initialize security-specific services
  const securitySetupOperations: (() => Promise<CommandResult<string>>)[] = [
    () => memory.initializeMemory(securityMemoryConfig),
    () => swarm.createSecuritySwarm().then(result => ({
      success: result.success,
      data: `Security Swarm: ${result.successfulTasks}/${result.totalTasks} agents spawned`,
      error: result.success ? undefined : 'Failed to create security swarm'
    })),
    () => swarm.enableByzantineTolerance(),
    () => neural.initializeNeural(),
  ];

  // Train neural models on security patterns
  securitySetupOperations.push(() => neural.trainErrorPatterns([
    {
      errorType: 'sql-injection',
      context: { inputValidation: false, parameterization: false },
      resolution: 'Implement parameterized queries',
      preventionStrategy: 'Input validation and ORM usage'
    },
    {
      errorType: 'xss-vulnerability',
      context: { outputEncoding: false, inputSanitization: false },
      resolution: 'Implement output encoding and input sanitization',
      preventionStrategy: 'Content Security Policy and secure templating'
    }
  ]).then(result => ({
    success: result.success,
    data: `Security patterns trained: ${result.successfulTasks} patterns`,
    error: result.success ? undefined : 'Failed to train security patterns'
  })));

  if (github && githubConfig) {
    securitySetupOperations.push(() => github!.setupGitHubIntegration(githubConfig));
    
    if (enableContinuousScanning) {
      securitySetupOperations.push(() => github!.setupWebhooks([
        {
          url: `${githubConfig.baseUrl || 'https://api.github.com'}/webhook/security-scan`,
          events: ['push', 'pull_request'],
          active: true
        }
      ]).then(result => ({
        success: result.success,
        data: `Security webhooks: ${result.successfulTasks} configured`,
        error: result.success ? undefined : 'Failed to setup security webhooks'
      })));
    }
  }

  const securitySetupResults = await utils.batch(securitySetupOperations);

  return { environment, securitySetupResults };
}

/**
 * Create a testing environment for CI/CD pipelines
 */
export async function createTestingEnvironment(options: {
  claudeConfig?: Partial<ClaudeFlowConfigType>;
  githubConfig?: GitHubConfigType;
  workingDirectory?: string;
  testTypes?: string[];
} = {}): Promise<{
  environment: Environment;
  testingSetupResults: BatchResult<string>;
}> {
  const {
    claudeConfig = {},
    githubConfig,
    workingDirectory = '/workspace/testing',
    testTypes = ['unit', 'integration', 'e2e', 'performance', 'security']
  } = options;

  const finalConfig: ClaudeFlowConfigType = {
    ...ConfigPresets.testing(),
    ...claudeConfig,
  };

  const testingSwarmConfig: SwarmConfigType = {
    topology: 'mesh',
    maxAgents: 12,
    enableMetrics: true,
    autoHeal: true,
    parallelTasks: 6,
  };

  const core = new ClaudeFlowDagger(finalConfig, workingDirectory);
  const sparc = new SparcModule(finalConfig, workingDirectory);
  const swarm = new SwarmModule(finalConfig, workingDirectory);
  const memory = new MemoryModule(finalConfig, workingDirectory);
  const neural = new NeuralModule(finalConfig, workingDirectory);
  const utils = new UtilsModule(finalConfig, workingDirectory);
  
  let github: GitHubModule | undefined;
  if (githubConfig) {
    github = new GitHubModule(finalConfig, workingDirectory);
  }

  const environment: Environment = {
    core,
    sparc,
    swarm,
    memory,
    neural,
    github,
    utils
  };

  // Setup testing-specific agents and workflows
  const testingSetupOperations: (() => Promise<CommandResult<string>>)[] = [
    () => swarm.initializeSwarm(testingSwarmConfig),
    () => swarm.spawnAgentTeam([
      { type: 'tester', config: { id: 'unit-tester', priority: 'high' } },
      { type: 'tester', config: { id: 'integration-tester', priority: 'high' } },
      { type: 'tester', config: { id: 'e2e-tester', priority: 'medium' } },
      { type: 'perf-analyzer', config: { id: 'perf-tester', priority: 'medium' } },
      { type: 'security-manager', config: { id: 'security-tester', priority: 'high' } }
    ]).then(result => ({
      success: result.success,
      data: `Testing agents: ${result.successfulTasks}/${result.totalTasks} spawned`,
      error: result.success ? undefined : 'Failed to spawn testing agents'
    }))
  ];

  if (github && githubConfig) {
    testingSetupOperations.push(() => github!.setupWorkflows([
      {
        name: 'continuous-testing',
        type: 'ci',
        triggers: ['push', 'pull_request'],
        config: { testTypes }
      }
    ]).then(result => ({
      success: result.success,
      data: `CI workflows: ${result.successfulTasks} configured`,
      error: result.success ? undefined : 'Failed to setup CI workflows'
    })));
  }

  const testingSetupResults = await utils.batch(testingSetupOperations);

  return { environment, testingSetupResults };
}

/**
 * Environment health check
 */
export async function checkEnvironmentHealth(environment: Environment): Promise<CommandResult<{
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: string;
  }[];
}>> {
  const healthChecks: (() => Promise<{ name: string; healthy: boolean; details: string }>)[] = [
    async () => {
      const result = await environment.core.exec(['--version']);
      return {
        name: 'claude-flow-core',
        healthy: result.success,
        details: result.success ? 'Core module operational' : (result.error || 'Core module failed')
      };
    },
    async () => {
      const result = await environment.swarm.getSwarmHealth();
      return {
        name: 'swarm',
        healthy: result.success,
        details: result.success ? `Swarm operational with ${result.data?.agents.length || 0} agents` : (result.error || 'Swarm unavailable')
      };
    },
    async () => {
      const result = await environment.memory.memoryUsage();
      return {
        name: 'memory',
        healthy: result.success,
        details: result.success ? 'Memory system operational' : (result.error || 'Memory system failed')
      };
    },
    async () => {
      const result = await environment.neural.getNeuralStatus();
      return {
        name: 'neural',
        healthy: result.success,
        details: result.success ? `Neural system with ${result.data?.models.length || 0} models` : (result.error || 'Neural system failed')
      };
    }
  ];

  if (environment.github) {
    healthChecks.push(async () => {
      const result = await environment.github!.getRepositoryMetrics();
      return {
        name: 'github',
        healthy: result.success,
        details: result.success ? 'GitHub integration operational' : (result.error || 'GitHub integration failed')
      };
    });
  }

  const healthResults = await Promise.allSettled(healthChecks.map(check => check()));
  
  const components = healthResults.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        name: result.value.name,
        status: result.value.healthy ? 'healthy' as const : 'unhealthy' as const,
        details: result.value.details
      };
    } else {
      return {
        name: `component-${index}`,
        status: 'unhealthy' as const,
        details: result.reason instanceof Error ? result.reason.message : String(result.reason)
      };
    }
  });

  const healthyCount = components.filter(c => c.status === 'healthy').length;
  const totalCount = components.length;
  
  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyCount === totalCount) {
    overall = 'healthy';
  } else if (healthyCount >= totalCount * 0.7) {
    overall = 'degraded';
  } else {
    overall = 'unhealthy';
  }

  return {
    success: true,
    data: { overall, components }
  };
}