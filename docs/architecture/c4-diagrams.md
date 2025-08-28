# C4 Architecture Diagrams

## C4 Model Overview

The C4 model provides a hierarchical approach to documenting the claude-flow Dagger module architecture through four levels of abstraction: Context, Containers, Components, and Code.

## Level 1: System Context Diagram

```mermaid
C4Context
    title System Context - Claude Flow Dagger Module

    Person(developer, "Developer", "Software developer using claude-flow for AI-assisted development")
    Person(devops, "DevOps Engineer", "Platform engineer setting up CI/CD pipelines")
    
    System_Boundary(cf_boundary, "Claude Flow Ecosystem") {
        System(cf_dagger, "Claude Flow Dagger Module", "Containerized Dagger wrapper for claude-flow CLI")
    }
    
    System_Ext(claude_api, "Claude API", "Anthropic's Claude AI service")
    System_Ext(github, "GitHub", "Source code repository and CI/CD platform")
    System_Ext(docker_registry, "Container Registry", "Docker Hub / GitHub Container Registry")
    System_Ext(k8s, "Kubernetes", "Container orchestration platform")
    System_Ext(ci_cd, "CI/CD Systems", "Jenkins, GitLab CI, Azure DevOps")
    
    Rel(developer, cf_dagger, "Uses", "Dagger functions")
    Rel(devops, cf_dagger, "Integrates", "CI/CD pipelines")
    
    Rel(cf_dagger, claude_api, "Calls", "HTTPS/REST")
    Rel(cf_dagger, github, "Integrates", "GitHub API")
    Rel(cf_dagger, docker_registry, "Pulls images", "Docker Registry API")
    
    Rel(ci_cd, cf_dagger, "Executes", "Dagger SDK")
    Rel(k8s, cf_dagger, "Orchestrates", "Container runtime")
    
    UpdateRelStyle(developer, cf_dagger, $offsetY="-40", $offsetX="-90")
    UpdateRelStyle(cf_dagger, claude_api, $offsetY="-40")
```

## Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram - Claude Flow Dagger Module

    Person(user, "Developer/DevOps", "Uses claude-flow capabilities")
    
    System_Boundary(dagger_system, "Claude Flow Dagger Module") {
        Container(dagger_module, "Dagger Module", "Go", "Provides programmatic interface to claude-flow CLI")
        Container(docker_image, "Docker Container", "Alpine Linux + Node.js", "Isolated runtime for claude-flow CLI")
        Container(cli_wrapper, "CLI Wrapper", "Node.js", "Claude-flow CLI with SPARC methodology")
    }
    
    System_Ext(claude_api, "Claude API", "AI service endpoint")
    System_Ext(github_api, "GitHub API", "Repository management")
    System_Ext(registry, "Container Registry", "Image storage")
    
    ContainerDb(config_store, "Configuration", "JSON/YAML", "Module configuration and secrets")
    ContainerDb(cache, "Cache Layer", "File System", "Build artifacts and temporary data")
    
    Rel(user, dagger_module, "Calls functions", "Dagger SDK")
    Rel(dagger_module, docker_image, "Manages", "Docker API")
    Rel(docker_image, cli_wrapper, "Executes", "Process execution")
    Rel(cli_wrapper, claude_api, "API calls", "HTTPS/REST")
    Rel(cli_wrapper, github_api, "Integrates", "HTTPS/REST")
    
    Rel(dagger_module, config_store, "Reads config", "File I/O")
    Rel(docker_image, cache, "Stores artifacts", "File I/O")
    Rel(dagger_module, registry, "Pulls images", "Registry API")
    
    UpdateRelStyle(user, dagger_module, $offsetX="-50")
    UpdateRelStyle(dagger_module, docker_image, $offsetY="-20")
```

## Level 3: Component Diagram - Dagger Module

```mermaid
C4Component
    title Component Diagram - Dagger Module

    Container_Boundary(dagger_module, "Dagger Module") {
        Component(main, "Main Module", "Go", "Primary entry point and module definition")
        Component(sparc_funcs, "SPARC Functions", "Go", "TDD, pipeline, batch execution functions")
        Component(agent_funcs, "Agent Functions", "Go", "Swarm initialization and agent management")
        Component(github_funcs, "GitHub Functions", "Go", "Repository integration and PR enhancement")
        Component(container_mgmt, "Container Management", "Go", "Docker image building and runtime management")
        
        Component(config_mgmt, "Configuration Manager", "Go", "Environment and parameter management")
        Component(validation, "Input Validator", "Go", "Parameter and configuration validation")
        Component(error_handler, "Error Handler", "Go", "Error wrapping and retry logic")
        Component(logger, "Logger", "Go", "Structured logging and observability")
        
        Component(types, "Type Definitions", "Go", "Request/response types and interfaces")
        Component(utils, "Utilities", "Go", "Common helper functions and constants")
    }
    
    Container_Ext(docker_runtime, "Docker Container", "Claude-flow CLI runtime")
    Container_Ext(dagger_engine, "Dagger Engine", "Container orchestration")
    
    Rel(main, sparc_funcs, "Uses")
    Rel(main, agent_funcs, "Uses")
    Rel(main, github_funcs, "Uses")
    Rel(main, container_mgmt, "Uses")
    
    Rel(sparc_funcs, container_mgmt, "Executes in")
    Rel(agent_funcs, container_mgmt, "Executes in")
    Rel(github_funcs, container_mgmt, "Executes in")
    
    Rel(sparc_funcs, config_mgmt, "Reads config")
    Rel(sparc_funcs, validation, "Validates input")
    Rel(sparc_funcs, error_handler, "Handles errors")
    Rel(sparc_funcs, logger, "Logs events")
    
    Rel(types, sparc_funcs, "Defines interfaces")
    Rel(utils, sparc_funcs, "Provides helpers")
    
    Rel(container_mgmt, docker_runtime, "Manages", "Docker API")
    Rel(main, dagger_engine, "Integrates", "Dagger SDK")
```

## Level 3: Component Diagram - Docker Container

```mermaid
C4Component
    title Component Diagram - Docker Container Runtime

    Container_Boundary(docker_container, "Docker Container") {
        Component(entrypoint, "Entrypoint Script", "Shell", "Container initialization and environment setup")
        Component(claude_cli, "Claude-Flow CLI", "Node.js", "Core claude-flow command-line interface")
        Component(sparc_engine, "SPARC Engine", "JavaScript", "Test-driven development workflow engine")
        Component(agent_system, "Agent System", "JavaScript", "Multi-agent coordination and swarm management")
        Component(github_integration, "GitHub Integration", "JavaScript", "Repository and PR management tools")
        
        Component(config_loader, "Configuration Loader", "JavaScript", "Environment and parameter loading")
        Component(secret_manager, "Secret Manager", "JavaScript", "Secure API key and token management")
        Component(output_formatter, "Output Formatter", "JavaScript", "Result formatting and artifact generation")
        Component(health_checker, "Health Checker", "JavaScript", "Container health and readiness validation")
        
        ComponentDb(workspace, "Workspace", "File System", "Working directory for source code and artifacts")
        ComponentDb(cache_dir, "Cache Directory", "File System", "Temporary files and build cache")
    }
    
    System_Ext(claude_api, "Claude API", "AI service")
    System_Ext(npm_registry, "NPM Registry", "Package repository")
    
    Rel(entrypoint, claude_cli, "Initializes")
    Rel(entrypoint, config_loader, "Loads config")
    Rel(entrypoint, secret_manager, "Manages secrets")
    
    Rel(claude_cli, sparc_engine, "Executes workflows")
    Rel(claude_cli, agent_system, "Manages agents")
    Rel(claude_cli, github_integration, "GitHub operations")
    
    Rel(sparc_engine, output_formatter, "Formats results")
    Rel(agent_system, output_formatter, "Formats results")
    
    Rel(claude_cli, workspace, "Reads/writes files")
    Rel(sparc_engine, cache_dir, "Caches artifacts")
    
    Rel(claude_cli, claude_api, "API calls", "HTTPS")
    Rel(entrypoint, npm_registry, "Package installation", "HTTPS")
    Rel(health_checker, claude_cli, "Health checks")
```

## Level 4: Code Diagram - SPARC Functions

```mermaid
classDiagram
    class ClaudeFlow {
        +Config *ClaudeFlowConfig
        +Container *Container
        +New() *ClaudeFlow
        +WithConfig(config *ClaudeFlowConfig) *ClaudeFlow
        +WithApiKey(apiKey *Secret) *ClaudeFlow
        +WithVersion(version string) *ClaudeFlow
        +SparcRun(ctx Context, mode string, task string, options *SparcOptions) (*SparcResult, error)
        +SparcTdd(ctx Context, feature string, options *TddOptions) (*TddResult, error)
        +SparcBatch(ctx Context, modes []string, task string, options *BatchOptions) (*BatchResult, error)
        +SparcPipeline(ctx Context, task string, options *PipelineOptions) (*PipelineResult, error)
    }
    
    class SparcOptions {
        +OutputFormat string
        +Verbose bool
        +Environment map[string]string
        +Timeout time.Duration
        +Validate() error
    }
    
    class SparcResult {
        +Mode string
        +Task string
        +Status string
        +Output string
        +Artifacts []Artifact
        +Metrics *ExecutionMetrics
        +Error string
        +ToJSON() ([]byte, error)
    }
    
    class TddOptions {
        +Coverage float64
        +Swarm *Swarm
        +TestFramework string
        +Phases []string
        +Validate() error
    }
    
    class TddResult {
        +Feature string
        +Phases []PhaseResult
        +TestsRun int
        +Coverage float64
        +Duration time.Duration
        +Status string
        +GenerateReport() (*Report, error)
    }
    
    class ContainerManager {
        +BuildImage(ctx Context, version string, options *BuildOptions) (*Container, error)
        +GetContainer(ctx Context, options *ContainerOptions) (*Container, error)
        +RunCommand(ctx Context, command string, options *RunOptions) (*CommandResult, error)
        +StopContainer(ctx Context, containerID string) error
        +CleanupContainers(ctx Context) error
    }
    
    class ConfigValidator {
        +rules []ValidationRule
        +AddRule(rule ValidationRule)
        +Validate(config *ClaudeFlowConfig) error
        +ValidateSparcOptions(options *SparcOptions) error
    }
    
    class ErrorHandler {
        +WrapError(err error, context string) error
        +IsRetryableError(err error) bool
        +RetryOperation(ctx Context, operation func() error, config *RetryConfig) error
        +FormatError(err error) string
    }
    
    ClaudeFlow --> SparcOptions : uses
    ClaudeFlow --> SparcResult : returns
    ClaudeFlow --> TddOptions : uses
    ClaudeFlow --> TddResult : returns
    ClaudeFlow --> ContainerManager : manages
    ClaudeFlow --> ConfigValidator : validates
    ClaudeFlow --> ErrorHandler : handles errors
    
    SparcOptions --> ConfigValidator : validated by
    TddOptions --> ConfigValidator : validated by
    SparcResult --> ErrorHandler : error handling
    TddResult --> ErrorHandler : error handling
```

## Deployment Architecture Diagram

```mermaid
C4Deployment
    title Deployment Diagram - Claude Flow Dagger Module

    Deployment_Node(dev_machine, "Developer Machine", "Local development") {
        Container(local_dagger, "Dagger CLI", "Go binary")
        Container(local_docker, "Docker Desktop", "Container runtime")
    }
    
    Deployment_Node(ci_server, "CI/CD Server", "GitHub Actions / Jenkins") {
        Container(ci_runner, "CI Runner", "Ubuntu VM")
        Container(dagger_ci, "Dagger Module", "Container execution")
    }
    
    Deployment_Node(k8s_cluster, "Kubernetes Cluster", "Production environment") {
        Deployment_Node(worker_node, "Worker Node", "K8s Node") {
            Container(claude_flow_pod, "Claude Flow Pod", "Application container")
            Container(sidecar, "Monitoring Sidecar", "Observability")
        }
        
        Deployment_Node(control_plane, "Control Plane", "K8s Master") {
            Container(api_server, "API Server", "K8s API")
            Container(scheduler, "Scheduler", "Pod scheduling")
        }
    }
    
    Deployment_Node(external_services, "External Services", "Cloud providers") {
        Container(claude_api_ext, "Claude API", "Anthropic service")
        Container(github_ext, "GitHub", "Repository hosting")
        Container(registry_ext, "Container Registry", "Image storage")
    }
    
    Rel(local_dagger, dagger_ci, "Triggers build", "CI/CD pipeline")
    Rel(dagger_ci, claude_flow_pod, "Deploys", "K8s API")
    Rel(claude_flow_pod, claude_api_ext, "API calls", "HTTPS")
    Rel(claude_flow_pod, github_ext, "Repository access", "HTTPS")
    Rel(k8s_cluster, registry_ext, "Pulls images", "Registry API")
    
    UpdateRelStyle(local_dagger, dagger_ci, $offsetY="-30")
    UpdateRelStyle(dagger_ci, claude_flow_pod, $offsetX="-50")
```

## Data Flow Diagram

```mermaid
graph TB
    subgraph "Input Layer"
        A[Developer Request] --> B[Dagger Function Call]
        B --> C[Parameter Validation]
    end
    
    subgraph "Processing Layer"
        C --> D[Container Initialization]
        D --> E[Environment Setup]
        E --> F[Claude-Flow CLI Execution]
        
        F --> G[SPARC Workflow]
        F --> H[Agent Management]
        F --> I[GitHub Integration]
        
        G --> J[AI Model Interaction]
        H --> J
        I --> J
    end
    
    subgraph "Output Layer"
        J --> K[Result Processing]
        K --> L[Artifact Generation]
        K --> M[Metrics Collection]
        
        L --> N[Output Formatting]
        M --> N
        N --> O[Response Return]
    end
    
    subgraph "External Systems"
        P[Claude API]
        Q[GitHub API]
        R[Container Registry]
        S[File System]
    end
    
    J -.->|API Calls| P
    I -.->|Repository Access| Q
    D -.->|Image Pull| R
    L -.->|Artifact Storage| S
    
    classDef inputLayer fill:#e1f5fe
    classDef processLayer fill:#f3e5f5
    classDef outputLayer fill:#e8f5e8
    classDef externalLayer fill:#fff3e0
    
    class A,B,C inputLayer
    class D,E,F,G,H,I,J processLayer
    class K,L,M,N,O outputLayer
    class P,Q,R,S externalLayer
```

## Security Architecture Diagram

```mermaid
graph TB
    subgraph "Security Boundaries"
        subgraph "Container Security"
            A[Non-root User] --> B[Read-only Root FS]
            B --> C[Resource Limits]
            C --> D[Security Contexts]
        end
        
        subgraph "Network Security"
            E[TLS Encryption] --> F[API Authentication]
            F --> G[Network Policies]
            G --> H[Service Mesh]
        end
        
        subgraph "Secret Management"
            I[HashiCorp Vault] --> J[Kubernetes Secrets]
            J --> K[Environment Variables]
            K --> L[Runtime Injection]
        end
        
        subgraph "Access Control"
            M[RBAC Policies] --> N[Service Accounts]
            N --> O[Pod Security Standards]
            O --> P[Admission Controllers]
        end
    end
    
    subgraph "Threat Mitigation"
        Q[Container Scanning] --> R[Vulnerability Assessment]
        R --> S[Security Monitoring]
        S --> T[Incident Response]
    end
    
    D -.-> E
    H -.-> I
    L -.-> M
    P -.-> Q
    
    classDef security fill:#ffebee
    classDef monitoring fill:#e3f2fd
    
    class A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P security
    class Q,R,S,T monitoring
```

These C4 diagrams provide a comprehensive view of the claude-flow Dagger module architecture at different levels of abstraction, from high-level system context down to detailed code structure, deployment, data flow, and security considerations.