import { jest } from '@jest/globals';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock Dagger SDK for unit tests
jest.mock('@dagger.io/dagger', () => ({
  dag: {
    container: () => ({
      from: jest.fn().mockReturnThis(),
      withWorkdir: jest.fn().mockReturnThis(),
      withExec: jest.fn().mockReturnThis(),
      withEnvVariable: jest.fn().mockReturnThis(),
      withSecretVariable: jest.fn().mockReturnThis(),
      withDirectory: jest.fn().mockReturnThis(),
      stdout: jest.fn().mockResolvedValue('mocked output')
    }),
    host: () => ({
      directory: jest.fn().mockReturnValue('mocked-directory')
    }),
    setSecret: jest.fn().mockReturnValue('mocked-secret')
  }
}));

// Global test utilities
global.testUtils = {
  createMockConfig: () => ({
    apiKey: 'test-api-key',
    modelName: 'claude-3-sonnet-20240229',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 300000,
    retries: 3,
    enableHooks: true,
    enableMemory: true,
    enableNeural: true
  }),
  
  createMockSwarmConfig: () => ({
    topology: 'mesh' as const,
    maxAgents: 10,
    sessionId: 'test-session',
    enableMetrics: true,
    autoHeal: true,
    parallelTasks: 5
  }),

  createMockTaskConfig: () => ({
    id: 'test-task-1',
    description: 'Test task description',
    agent: 'coder' as const,
    priority: 'medium' as const,
    timeout: 300000,
    retries: 2,
    dependencies: [],
    metadata: {}
  })
};

// Declare global types
declare global {
  var testUtils: {
    createMockConfig: () => any;
    createMockSwarmConfig: () => any;
    createMockTaskConfig: () => any;
  };
}

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});