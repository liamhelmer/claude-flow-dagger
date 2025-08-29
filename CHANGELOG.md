# [2.4.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v2.3.0...v2.4.0) (2025-08-29)


### Bug Fixes

* workflow fix ([c650d05](https://github.com/liamhelmer/claude-flow-dagger/commit/c650d05279bb96f2273a529e0a112c3d077c2195))

# [2.3.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v2.2.0...v2.3.0) (2025-08-29)


### Bug Fixes

* workflow fix ([d98d9d9](https://github.com/liamhelmer/claude-flow-dagger/commit/d98d9d9602e68052d669b65b3b008f7d37c1f5a6))

# [2.2.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v2.1.0...v2.2.0) (2025-08-29)


### Features

* enable multi-platform Docker builds for arm64 and amd64 ([52dc86b](https://github.com/liamhelmer/claude-flow-dagger/commit/52dc86b9699d30133841354eb44d7972c52f2fcb))

# [2.1.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v2.0.0...v2.1.0) (2025-08-29)


### Features

* add comprehensive test workflow for Claude Flow module ([cc69c5d](https://github.com/liamhelmer/claude-flow-dagger/commit/cc69c5d38bcb536ee59f36e36734fc0db5d4f14c))

# [2.0.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.11.0...v2.0.0) (2025-08-28)


### Code Refactoring

* complete Docker-based Dagger module implementation ([ff74cc3](https://github.com/liamhelmer/claude-flow-dagger/commit/ff74cc333380c71c25454204280b0fac324b8c0b))


### BREAKING CHANGES

* Completely refactored to use Docker container for all operations

- Simplified architecture to use Docker container for all claude-flow operations
- Removed complex module structure in favor of single unified interface
- Updated all dependencies to latest major versions (Dagger 0.18.16, etc)
- Added comprehensive LLM configuration passthrough from Dagger environment
- All 50+ CLI commands now available through container execution
- Added detailed usage examples and updated documentation
- Improved type safety with latest TypeScript features
- Optimized for CI/CD with non-interactive mode by default

The module now runs claude-flow entirely within the published Docker container,
ensuring consistency across environments and eliminating dependency issues.

# [1.11.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.10.0...v1.11.0) (2025-08-28)


### Performance Improvements

* optimize Docker build for faster CI/CD ([7cc1ded](https://github.com/liamhelmer/claude-flow-dagger/commit/7cc1ded4a365e16c1368a242742d18674954307f))

# [1.10.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.9.0...v1.10.0) (2025-08-28)


### Bug Fixes

* remove unavailable Google Cloud SDK components ([9d0bd95](https://github.com/liamhelmer/claude-flow-dagger/commit/9d0bd959b8aa338935a1a154bc1ae9c01eeffc06))

# [1.9.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.8.0...v1.9.0) (2025-08-28)


### Bug Fixes

* replace exa with eza for Ubuntu 24.04 compatibility ([4f87af0](https://github.com/liamhelmer/claude-flow-dagger/commit/4f87af0d4b3af71eb411b111f334cf599244fcab))

# [1.8.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.7.0...v1.8.0) (2025-08-28)


### Bug Fixes

* remove unavailable MCP server packages ([1d075bd](https://github.com/liamhelmer/claude-flow-dagger/commit/1d075bdf2af94a86183b72571b50999c1105201a))

# [1.7.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.6.0...v1.7.0) (2025-08-28)


### Bug Fixes

* remove non-existent @anthropic/claude-cli package ([94fb3fc](https://github.com/liamhelmer/claude-flow-dagger/commit/94fb3fcb073fffc6ce05fd9171b01943fab2f8b7))

# [1.6.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.5.0...v1.6.0) (2025-08-28)


### Bug Fixes

* use jammy repository for MongoDB on Ubuntu 24.04 ([9f55d37](https://github.com/liamhelmer/claude-flow-dagger/commit/9f55d3744daded962a0c3285eb7a3c509406e027))

# [1.5.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.4.0...v1.5.0) (2025-08-28)


### Bug Fixes

* use apt packages for Google Cloud SDK components ([4073c94](https://github.com/liamhelmer/claude-flow-dagger/commit/4073c9420b7a871eaccbb53329317dee435cb453))

# [1.4.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.3.0...v1.4.0) (2025-08-28)


### Bug Fixes

* remove deprecated datalab component from Google Cloud SDK ([4ff2f00](https://github.com/liamhelmer/claude-flow-dagger/commit/4ff2f00f351045b16ee386cf7435833bc1975203))

# [1.3.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.2.0...v1.3.0) (2025-08-28)


### Bug Fixes

* simplify Python installation in Dockerfile ([e1ff375](https://github.com/liamhelmer/claude-flow-dagger/commit/e1ff37595088437867fa5e02c132160639b3eca8))

# [1.2.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.1.0...v1.2.0) (2025-08-28)


### Bug Fixes

* simplify Python installation in Dockerfile ([4f06100](https://github.com/liamhelmer/claude-flow-dagger/commit/4f06100d9e55841e4bd87141d21b8d360581f50c))

# [1.1.0](https://github.com/liamhelmer/claude-flow-dagger/compare/v1.0.0...v1.1.0) (2025-08-28)


### Bug Fixes

* add missing MCP servers configuration for Docker build ([5591cb5](https://github.com/liamhelmer/claude-flow-dagger/commit/5591cb5a3cb697d2b54753b0824f8ab969c3b0bd))

# 1.0.0 (2025-08-28)


### Bug Fixes

* add semantic-release dependencies and configure workflow ([3043002](https://github.com/liamhelmer/claude-flow-dagger/commit/304300279068e5c949627581d9a4317599191a82))


### Features

* add semantic release and Docker build GitHub Actions workflow ([149dfb1](https://github.com/liamhelmer/claude-flow-dagger/commit/149dfb18b1bd7933135c67d2c0574e1a5b783157))
