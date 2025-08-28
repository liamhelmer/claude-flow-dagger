# Claude Flow Dagger Test Suite

Comprehensive testing framework for the Claude Flow Dagger module, covering unit tests, integration tests, security scanning, performance benchmarking, and end-to-end workflows.

## Test Structure

```
tests/
├── unit/                    # Unit tests for core functionality
│   ├── types.test.ts       # Type validation and schema tests
│   └── core.test.ts        # Dagger module functionality tests
├── integration/            # Integration tests with real containers
│   └── workflow.test.ts    # Command chaining and workflow tests
├── docker/                 # Docker image validation
│   └── image-validation.test.ts
├── security/               # Security and vulnerability tests
│   └── scan.test.ts        # Trivy, Snyk, and security checks
├── performance/            # Performance and benchmarking
│   └── benchmarks.test.ts  # Load testing and resource monitoring
├── e2e/                    # End-to-end complete workflows
│   └── complete-workflow.test.ts
├── ci-cd/                  # CI/CD pipeline integration
│   └── pipeline.test.ts    # Build, test, and deployment validation
├── jest.config.js          # Jest configuration
├── setup.ts                # Global test setup and utilities
└── test-runner.ts          # Orchestrated test execution
```

## Quick Start

### Run All Available Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests (always available)
npm run test:unit

# Integration tests (requires INTEGRATION_TESTS=true)
npm run test:integration

# Docker validation (requires DOCKER_TESTS=true)
npm run test:docker

# Security scanning (requires SECURITY_TESTS=true)
npm run test:security

# Performance tests (requires PERFORMANCE_TESTS=true)
npm run test:performance

# End-to-end workflows (requires E2E_TESTS=true + CLAUDE_API_KEY)
npm run test:e2e

# CI/CD pipeline tests (requires CICD_TESTS=true + CI=true)
npm run test:cicd
```

### Run All Tests (Full Suite)
```bash
npm run test:all
```

## Environment Configuration

### Required Environment Variables

| Variable | Required For | Description |
|----------|-------------|-------------|
| `INTEGRATION_TESTS=true` | Integration tests | Enable container-based integration testing |
| `DOCKER_TESTS=true` | Docker tests | Enable Docker image validation and testing |
| `SECURITY_TESTS=true` | Security tests | Enable vulnerability scanning and security checks |
| `PERFORMANCE_TESTS=true` | Performance tests | Enable benchmarking and performance testing |
| `E2E_TESTS=true` | E2E tests | Enable complete workflow testing |
| `CICD_TESTS=true` | CI/CD tests | Enable pipeline integration testing |
| `CI=true` | CI/CD tests | Indicate running in CI environment |

### Optional Environment Variables

| Variable | Description |
|----------|-------------|
| `CLAUDE_API_KEY` | Claude API key for E2E tests |
| `GITHUB_TOKEN` | GitHub token for GitHub integration tests |
| `SNYK_TOKEN` | Snyk token for security scanning |
| `DOCKER_REGISTRY` | Docker registry for image publishing tests |

## Test Categories

### 1. Unit Tests (`tests/unit/`)

**Purpose**: Test individual functions and modules in isolation.

**Features**:
- Type validation with Zod schemas
- Dagger module API testing
- Mock external dependencies
- Fast execution (< 2 minutes)
- No external requirements

**Coverage Requirements**:
- Lines: >80%
- Functions: >80%
- Branches: >75%
- Statements: >80%

### 2. Integration Tests (`tests/integration/`)

**Purpose**: Test component interactions with real containers.

**Features**:
- Real Dagger container execution
- Command chaining validation
- Error handling scenarios
- Non-interactive mode verification
- Timeout: 5 minutes per test

### 3. Docker Image Validation (`tests/docker/`)

**Purpose**: Comprehensive Docker image testing and validation.

**Test Coverage**:
- ✅ Image building and metadata
- ✅ Runtime environment validation
- ✅ Tool installation verification
- ✅ Version compatibility checks
- ✅ Environment configuration
- ✅ Health check validation
- ✅ Image size optimization

**Key Validations**:
- Node.js 22.x
- Python 3.13
- Go 1.23.1
- Google Cloud SDK with alpha components
- AWS CLI v2, Azure CLI
- HashiCorp tools (Vault, Terraform)
- Dagger CLI
- Database clients (PostgreSQL, MySQL, Redis, MongoDB)
- Claude CLI and claude-flow v2.0.0-alpha.101
- MCP servers
- Security tools (Bandit, Safety, Snyk)

### 4. Security Tests (`tests/security/`)

**Purpose**: Vulnerability scanning and security validation.

**Security Tools**:
- **Trivy**: Container vulnerability scanning
- **Snyk**: Dependency and container security
- **Bandit**: Python static security analysis
- **Custom**: Hardcoded secret detection

**Security Checks**:
- HIGH/CRITICAL vulnerability detection
- Secret scanning
- Dockerfile security best practices
- Dependency vulnerability analysis
- Static code security analysis

### 5. Performance Tests (`tests/performance/`)

**Purpose**: Performance benchmarking and resource monitoring.

**Performance Metrics**:
- Container startup time
- Command execution overhead
- Memory usage monitoring
- Concurrent operation handling
- Resource leak detection
- Performance regression testing

**Benchmarks**:
- Simple operations: < 5 seconds
- SPARC initialization: < 15 seconds
- Memory operations: < 3 seconds
- Batch operations: < 20 seconds
- Memory growth: < 100MB during load

### 6. End-to-End Tests (`tests/e2e/`)

**Purpose**: Complete workflow validation from start to finish.

**Test Scenarios**:
- Complete SPARC TDD workflow
- Swarm orchestration lifecycle
- Memory and neural integration
- GitHub workflow integration
- Error handling and resilience
- Network timeout and retry behavior

**Workflow Validation**:
1. SPARC environment initialization
2. Requirements gathering (spec-pseudocode)
3. System architecture design
4. Backend development implementation
5. TDD workflow execution
6. Integration and deployment

### 7. CI/CD Pipeline Tests (`tests/ci-cd/`)

**Purpose**: Validate CI/CD pipeline integration and deployment readiness.

**Pipeline Validation**:
- TypeScript compilation
- Linting and code quality
- Build artifact generation
- Test execution in CI
- Coverage reporting
- Docker builds in CI
- Security scanning integration
- Package validation for publishing
- Environment configuration
- Performance in CI environment

## Advanced Features

### Test Runner (`tests/test-runner.ts`)

Intelligent test orchestration that:
- Auto-detects available test suites based on environment
- Runs tests in optimal order
- Generates comprehensive reports
- Provides detailed failure analysis
- Supports selective test execution

### Global Test Utilities (`tests/setup.ts`)

Shared testing infrastructure:
- Mock factories for common objects
- Global test configuration
- Dagger SDK mocking
- Error handling setup
- Performance monitoring utilities

### Coverage and Reporting

Comprehensive reporting includes:
- Test execution summary
- Coverage metrics (HTML, LCOV, JSON)
- Performance benchmarks
- Security scan results
- CI/CD validation reports

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert Pattern**
```typescript
test('should handle command execution', async () => {
  // Arrange
  const claudeFlow = new ClaudeFlowDagger(mockConfig);
  
  // Act
  const result = await claudeFlow.exec(['test', 'command']);
  
  // Assert
  expect(result.success).toBe(true);
});
```

2. **Descriptive Test Names**
```typescript
// Good
test('should return error when invalid SPARC mode provided')

// Bad
test('invalid mode test')
```

3. **Proper Mocking**
```typescript
// Mock external dependencies
jest.mock('@dagger.io/dagger');

// Use type-safe mocks
const mockContainer = mockDag.container() as jest.Mocked<Container>;
```

4. **Timeout Management**
```typescript
// Set appropriate timeouts
test('long running operation', async () => {
  // test implementation
}, 60000); // 1 minute timeout
```

### Performance Considerations

1. **Parallel Execution**: Tests run in parallel where possible
2. **Resource Cleanup**: Always clean up created resources
3. **Mock Heavy Operations**: Mock expensive operations in unit tests
4. **Selective Execution**: Use environment flags to control test execution

### Security Testing

1. **No Real Secrets**: Never use real API keys or secrets in tests
2. **Scan Dependencies**: Regular dependency vulnerability scanning
3. **Container Security**: Validate Docker image security practices
4. **Static Analysis**: Use multiple security analysis tools

## Continuous Integration

### GitHub Actions Integration

```yaml
- name: Run Tests
  run: |
    # Unit tests (always)
    npm run test:unit
    
    # Integration tests (if Docker available)
    if command -v docker &> /dev/null; then
      npm run test:integration
    fi
    
    # CI/CD tests
    CICD_TESTS=true npm run test:cicd

- name: Security Scanning
  run: |
    SECURITY_TESTS=true npm run test:security

- name: Performance Benchmarks
  run: |
    PERFORMANCE_TESTS=true npm run test:performance
```

### Local Development

```bash
# Quick validation
npm run validate

# Full test suite (requires all env vars)
npm run test:all

# Watch mode for development
npm run test:watch
```

## Troubleshooting

### Common Issues

1. **Docker Tests Failing**
   - Ensure Docker is running
   - Set `DOCKER_TESTS=true`
   - Check Docker permissions

2. **Integration Tests Timeout**
   - Increase timeout values
   - Check network connectivity
   - Verify Dagger installation

3. **Security Scans False Positives**
   - Review scan results manually
   - Adjust severity thresholds
   - Update security tool versions

4. **Performance Tests Inconsistent**
   - Run on stable hardware
   - Account for system load
   - Use multiple iterations

### Debug Mode

Enable verbose logging:
```bash
DEBUG=* npm run test:unit
```

### Memory Issues

Monitor memory usage:
```bash
node --max-old-space-size=4096 node_modules/.bin/jest
```

## Contributing

When adding new tests:

1. Follow the existing file structure
2. Add appropriate environment variable guards
3. Update this README with new test descriptions
4. Ensure tests are deterministic and repeatable
5. Add proper cleanup and resource management
6. Update timeout values as needed

## Support

For test-related issues:
1. Check the test output and error messages
2. Verify environment variable configuration
3. Ensure all required dependencies are installed
4. Review the test-specific documentation above

---

**Test Coverage Goal**: >80% for all critical paths
**Performance Target**: All tests complete within allocated timeouts
**Security Standard**: Zero HIGH/CRITICAL vulnerabilities in production
**Reliability**: Tests must be deterministic and repeatable across environments