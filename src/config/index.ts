/**
 * Configuration management for Claude Flow Dagger module
 */

import { z } from 'zod';
import * as dotenv from 'dotenv';
import { ClaudeFlowConfig, Environment, ConfigPreset, EnvironmentSchema } from '../types';

// Load environment variables
dotenv.config();

// Configuration schema
const ConfigSchema = z.object({
  apiKey: z.string().optional(),
  environment: EnvironmentSchema.default('development'),
  baseUrl: z.string().optional(),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'text']).default('json'),
    destination: z.enum(['console', 'file', 'both']).default('console')
  }).optional(),
  docker: z.object({
    registry: z.string().optional(),
    namespace: z.string().optional(),
    tag: z.string().optional()
  }).optional(),
  memory: z.object({
    provider: z.enum(['redis', 'postgresql', 'memory', 'file']).default('memory'),
    connectionUrl: z.string().optional(),
    ttl: z.number().optional(),
    maxSize: z.string().optional(),
    compression: z.boolean().default(false),
    encryption: z.boolean().default(false)
  }).optional(),
  github: z.object({
    token: z.string().optional(),
    owner: z.string().optional(),
    repo: z.string().optional(),
    branch: z.string().default('main'),
    autoMerge: z.boolean().default(false),
    requireReviews: z.number().default(1)
  }).optional(),
  features: z.object({
    sparc: z.boolean().default(true),
    swarm: z.boolean().default(true),
    neural: z.boolean().default(true),
    memory: z.boolean().default(true),
    github: z.boolean().default(true)
  }).optional()
});

// Configuration presets
export const CONFIG_PRESETS: Record<string, ConfigPreset> = {
  development: {
    name: 'Development',
    description: 'Local development configuration',
    config: {
      environment: 'development' as Environment,
      logging: {
        level: 'debug',
        format: 'text',
        destination: 'console'
      },
      timeout: 60000,
      retries: 1
    }
  },
  production: {
    name: 'Production',
    description: 'Production deployment configuration',
    config: {
      environment: 'production' as Environment,
      logging: {
        level: 'info',
        format: 'json',
        destination: 'both'
      },
      timeout: 30000,
      retries: 3,
      docker: {
        registry: 'docker.io',
        namespace: 'claudeflow',
        tag: 'latest'
      }
    }
  },
  testing: {
    name: 'Testing',
    description: 'Test environment configuration',
    config: {
      environment: 'testing' as Environment,
      logging: {
        level: 'warn',
        format: 'json',
        destination: 'console'
      },
      timeout: 10000,
      retries: 0
    }
  },
  ci: {
    name: 'CI/CD',
    description: 'Continuous integration configuration',
    config: {
      environment: 'ci' as Environment,
      logging: {
        level: 'info',
        format: 'json',
        destination: 'console'
      },
      timeout: 120000,
      retries: 2
    }
  }
};

/**
 * Load configuration from environment variables
 * Supports both Claude Flow and Dagger LLM configuration
 */
export function loadConfigFromEnv(): Partial<ClaudeFlowConfig> {
  const config: Partial<ClaudeFlowConfig> = {};

  // API Configuration - Support multiple environment variable names
  // Priority: ANTHROPIC > DAGGER > CLAUDE
  const apiKey = process.env.ANTHROPIC_AUTH_TOKEN ||
                 process.env.DAGGER_ANTHROPIC_AUTH_TOKEN ||
                 process.env.CLAUDE_API_KEY;
  
  if (apiKey) {
    config.apiKey = apiKey;
  }
  
  // Base URL configuration with Dagger LLM support
  const baseUrl = process.env.ANTHROPIC_BASE_URL ||
                  process.env.DAGGER_ANTHROPIC_BASE_URL ||
                  process.env.CLAUDE_BASE_URL ||
                  process.env.CLAUDE_FLOW_BASE_URL;
  
  if (baseUrl) {
    config.baseUrl = baseUrl;
  }
  
  if (process.env.CLAUDE_FLOW_ENVIRONMENT) {
    config.environment = process.env.CLAUDE_FLOW_ENVIRONMENT as Environment;
  }

  // Timeout and retries
  if (process.env.CLAUDE_FLOW_TIMEOUT) {
    config.timeout = parseInt(process.env.CLAUDE_FLOW_TIMEOUT, 10);
  }
  
  if (process.env.CLAUDE_FLOW_RETRIES) {
    config.retries = parseInt(process.env.CLAUDE_FLOW_RETRIES, 10);
  }

  // Docker configuration
  if (process.env.DOCKER_REGISTRY || process.env.DOCKER_NAMESPACE || process.env.DOCKER_TAG) {
    config.docker = {
      registry: process.env.DOCKER_REGISTRY,
      namespace: process.env.DOCKER_NAMESPACE,
      tag: process.env.DOCKER_TAG
    };
  }

  // Memory configuration
  if (process.env.MEMORY_PROVIDER) {
    config.memory = {
      provider: process.env.MEMORY_PROVIDER as any,
      connectionUrl: process.env.MEMORY_CONNECTION_URL,
      ttl: process.env.MEMORY_TTL ? parseInt(process.env.MEMORY_TTL, 10) : undefined,
      maxSize: process.env.MEMORY_MAX_SIZE,
      compression: process.env.MEMORY_COMPRESSION === 'true',
      encryption: process.env.MEMORY_ENCRYPTION === 'true'
    };
  }

  // GitHub configuration
  if (process.env.GITHUB_TOKEN) {
    config.github = {
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      branch: process.env.GITHUB_BRANCH || 'main',
      autoMerge: process.env.GITHUB_AUTO_MERGE === 'true',
      requireReviews: process.env.GITHUB_REQUIRE_REVIEWS ? 
        parseInt(process.env.GITHUB_REQUIRE_REVIEWS, 10) : 1
    };
  }

  // Feature flags
  if (process.env.FEATURES_SPARC !== undefined ||
      process.env.FEATURES_SWARM !== undefined ||
      process.env.FEATURES_NEURAL !== undefined ||
      process.env.FEATURES_MEMORY !== undefined ||
      process.env.FEATURES_GITHUB !== undefined) {
    config.features = {
      sparc: process.env.FEATURES_SPARC !== 'false',
      swarm: process.env.FEATURES_SWARM !== 'false',
      neural: process.env.FEATURES_NEURAL !== 'false',
      memory: process.env.FEATURES_MEMORY !== 'false',
      github: process.env.FEATURES_GITHUB !== 'false'
    };
  }

  return config;
}

/**
 * Validate and merge configuration
 */
export function validateConfig(userConfig?: Partial<ClaudeFlowConfig>): ClaudeFlowConfig {
  // Load environment configuration
  const envConfig = loadConfigFromEnv();
  
  // Determine environment
  const environment = userConfig?.environment || envConfig.environment || 'development';
  
  // Get preset for environment
  const preset = CONFIG_PRESETS[environment]?.config || {};
  
  // Merge configurations (priority: user > env > preset > defaults)
  const mergedConfig = {
    ...preset,
    ...envConfig,
    ...userConfig,
    environment
  };

  // Validate with schema
  const result = ConfigSchema.parse(mergedConfig);
  
  return result as ClaudeFlowConfig;
}

/**
 * Get configuration for specific environment
 */
export function getConfigForEnvironment(env: Environment): ClaudeFlowConfig {
  const preset = CONFIG_PRESETS[env];
  if (!preset) {
    throw new Error(`No configuration preset for environment: ${env}`);
  }
  
  return validateConfig(preset.config);
}

/**
 * Export configuration as environment variables
 */
export function exportConfigAsEnv(config: ClaudeFlowConfig): Record<string, string> {
  const env: Record<string, string> = {};

  if (config.apiKey) env.CLAUDE_API_KEY = config.apiKey;
  env.CLAUDE_FLOW_ENVIRONMENT = config.environment;
  if (config.baseUrl) env.CLAUDE_FLOW_BASE_URL = config.baseUrl;
  env.CLAUDE_FLOW_TIMEOUT = config.timeout.toString();
  env.CLAUDE_FLOW_RETRIES = config.retries.toString();

  if (config.logging) {
    env.LOG_LEVEL = config.logging.level;
    env.LOG_FORMAT = config.logging.format;
    env.LOG_DESTINATION = config.logging.destination;
  }

  if (config.docker) {
    if (config.docker.registry) env.DOCKER_REGISTRY = config.docker.registry;
    if (config.docker.namespace) env.DOCKER_NAMESPACE = config.docker.namespace;
    if (config.docker.tag) env.DOCKER_TAG = config.docker.tag;
  }

  if (config.memory) {
    env.MEMORY_PROVIDER = config.memory.provider;
    if (config.memory.connectionUrl) env.MEMORY_CONNECTION_URL = config.memory.connectionUrl;
    if (config.memory.ttl) env.MEMORY_TTL = config.memory.ttl.toString();
    if (config.memory.maxSize) env.MEMORY_MAX_SIZE = config.memory.maxSize;
    env.MEMORY_COMPRESSION = config.memory.compression.toString();
    env.MEMORY_ENCRYPTION = config.memory.encryption.toString();
  }

  if (config.github) {
    if (config.github.token) env.GITHUB_TOKEN = config.github.token;
    if (config.github.owner) env.GITHUB_OWNER = config.github.owner;
    if (config.github.repo) env.GITHUB_REPO = config.github.repo;
    if (config.github.branch) env.GITHUB_BRANCH = config.github.branch;
    env.GITHUB_AUTO_MERGE = (config.github.autoMerge || false).toString();
    env.GITHUB_REQUIRE_REVIEWS = (config.github.requireReviews || 1).toString();
  }

  if (config.features) {
    env.FEATURES_SPARC = (config.features.sparc || true).toString();
    env.FEATURES_SWARM = (config.features.swarm || true).toString();
    env.FEATURES_NEURAL = (config.features.neural || true).toString();
    env.FEATURES_MEMORY = (config.features.memory || true).toString();
    env.FEATURES_GITHUB = (config.features.github || true).toString();
  }

  return env;
}

// Export default configuration
export const defaultConfig = validateConfig();