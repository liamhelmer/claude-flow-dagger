# Multi-stage Dockerfile for Claude Flow with all required tools
# Optimized for August 2025 standards with latest stable versions

# Stage 1: Base system with essential tools
FROM ubuntu:24.04 AS base

# Prevent interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# System essentials and security updates
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        wget \
        gnupg \
        lsb-release \
        software-properties-common \
        apt-transport-https \
        build-essential \
        git \
        jq \
        vim \
        nano \
        htop \
        zip \
        unzip \
        openssh-client \
        sudo \
        locales \
        tzdata \
    && locale-gen en_US.UTF-8 \
    && update-locale LANG=en_US.UTF-8 \
    && ln -fs /usr/share/zoneinfo/UTC /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Stage 2: Programming languages and runtimes
FROM base AS runtimes

# Node.js 22.x (latest LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest yarn pnpm && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Python 3 (Latest available in Ubuntu 24.04)
RUN apt-get update && \
    apt-get install -y \
        python3 \
        python3-dev \
        python3-venv \
        python3-pip \
        pipx \
    && update-alternatives --install /usr/bin/python python /usr/bin/python3 1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Go 1.23.1
RUN wget -q https://go.dev/dl/go1.23.1.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.23.1.linux-amd64.tar.gz && \
    rm go1.23.1.linux-amd64.tar.gz

ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/go"
ENV PATH="${GOPATH}/bin:${PATH}"

# Rust (stable)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"

# Stage 3: Cloud SDKs and tools
FROM runtimes AS cloud-tools

# Google Cloud SDK with ALL components including alpha
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | \
    tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | \
    gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg && \
    apt-get update && \
    apt-get install -y google-cloud-cli && \
    gcloud components install \
        alpha \
        beta \
        app-engine-go \
        app-engine-java \
        app-engine-python \
        app-engine-python-extras \
        bigtable \
        cbt \
        cloud-build-local \
        cloud-datastore-emulator \
        cloud-firestore-emulator \
        cloud-spanner-emulator \
        cloud-sql-proxy \
        datalab \
        gke-gcloud-auth-plugin \
        kubectl \
        kustomize \
        local-extract \
        pubsub-emulator \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws/

# Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Stage 4: Database clients and tools
FROM cloud-tools AS database-tools

# PostgreSQL 16 client
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    apt-get update && \
    apt-get install -y postgresql-client-16 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# MySQL 8.0 client
RUN apt-get update && \
    apt-get install -y mysql-client && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Redis tools
RUN apt-get update && \
    apt-get install -y redis-tools && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# MongoDB tools
RUN wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add - && \
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && \
    apt-get install -y mongodb-org-tools mongodb-mongosh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Stage 5: Claude tools and MCP servers
FROM database-tools AS claude-tools

# Install Claude CLI
RUN npm install -g @anthropic/claude-cli@latest

# Install claude-flow v2.0.0-alpha.101
ARG CLAUDE_FLOW_VERSION=2.0.0-alpha.101
RUN npm install -g claude-flow@${CLAUDE_FLOW_VERSION}

# Install MCP servers
RUN npm install -g \
    @modelcontextprotocol/server-filesystem \
    @modelcontextprotocol/server-git \
    @modelcontextprotocol/server-github \
    @modelcontextprotocol/server-postgresql \
    @modelcontextprotocol/server-memory \
    @modelcontextprotocol/server-brave-search

# Stage 6: Additional development tools
FROM claude-tools AS dev-tools

# HashiCorp tools
RUN wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
    tee /etc/apt/sources.list.d/hashicorp.list && \
    apt-get update && \
    apt-get install -y \
        vault \
        terraform \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Dagger CLI
RUN cd /tmp && \
    curl -fsSL https://dl.dagger.io/dagger/install.sh | sh && \
    mv /tmp/bin/dagger /usr/local/bin/ && \
    rm -rf /tmp/bin

# Docker CLI and Docker-in-Docker support
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - && \
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" && \
    apt-get update && \
    apt-get install -y docker-ce-cli docker-buildx-plugin docker-compose-plugin && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
    dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | \
    tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install -y gh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Development utilities
RUN apt-get update && \
    apt-get install -y \
        ripgrep \
        fd-find \
        bat \
        exa \
        fzf \
        tmux \
        neovim \
        httpie \
        tree \
        ncdu \
        tldr \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Kubernetes tools
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && \
    rm kubectl && \
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Stage 7: Final optimized image
FROM dev-tools AS final

# Create non-root user
RUN useradd -m -s /bin/bash claude && \
    echo 'claude ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Setup working directory
WORKDIR /workspace
RUN chown -R claude:claude /workspace

# Configure claude-flow
RUN mkdir -p /home/claude/.config/claude-flow && \
    chown -R claude:claude /home/claude/.config

# Environment variables
ENV NODE_ENV=production
ENV CLAUDE_FLOW_NON_INTERACTIVE=true
ENV PATH="/usr/local/go/bin:/go/bin:/root/.cargo/bin:${PATH}"
ENV DOCKER_HOST=unix:///var/run/docker.sock

# Dagger LLM Integration Support
# These will be overridden by actual values from Dagger engine at runtime
ENV DAGGER_LLM_INTEGRATION=true
ENV ANTHROPIC_BASE_URL=""
ENV ANTHROPIC_AUTH_TOKEN=""
ENV DAGGER_ANTHROPIC_BASE_URL=""
ENV DAGGER_ANTHROPIC_AUTH_TOKEN=""

# Copy configuration files
COPY --chown=claude:claude docker/config/claude-flow-config.json /home/claude/.config/claude-flow/config.json
COPY --chown=claude:claude docker/config/mcp-servers.json /home/claude/.config/claude/mcp-servers.json

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD claude-flow version || exit 1

# Security scanning
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Labels
LABEL maintainer="Claude Flow Team"
LABEL version="${CLAUDE_FLOW_VERSION}"
LABEL description="Complete Claude Flow development environment with all tools"
LABEL org.opencontainers.image.source="https://github.com/ruvnet/claude-flow"
LABEL org.opencontainers.image.version="${CLAUDE_FLOW_VERSION}"
LABEL org.opencontainers.image.created="2025-08-28"

# Switch to non-root user
USER claude

# Entrypoint
ENTRYPOINT ["/bin/bash"]
CMD ["-l"]