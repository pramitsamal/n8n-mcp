# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

n8n-mcp is a comprehensive documentation and knowledge server that provides AI assistants with complete access to n8n node information through the Model Context Protocol (MCP). It serves as a bridge between n8n's workflow automation platform and AI models, enabling them to understand and work with n8n nodes effectively.

**Current version: 2.36.1**

### Current Architecture:
```
src/
├── loaders/
│   ├── node-loader.ts          # NPM package loader for n8n packages
│   └── simple-parser.ts        # Simplified parser for quick extraction
├── parsers/
│   ├── node-parser.ts          # Enhanced parser with version support
│   └── property-extractor.ts   # Dedicated property/operation extraction
├── mappers/
│   └── docs-mapper.ts          # Documentation mapping with fixes
├── database/
│   ├── schema.sql              # SQLite schema
│   ├── schema-optimized.sql    # Optimized schema variant
│   ├── node-repository.ts      # Data access layer
│   ├── database-adapter.ts     # Universal database adapter
│   ├── shared-database.ts      # Shared database state management
│   └── migrations/             # SQL migration scripts
├── services/
│   ├── property-filter.ts             # Filters properties to essentials
│   ├── example-generator.ts           # Generates working examples
│   ├── task-templates.ts              # Pre-configured node settings
│   ├── config-validator.ts            # Configuration validation
│   ├── enhanced-config-validator.ts   # Operation-aware validation
│   ├── node-specific-validators.ts    # Node-specific validation logic
│   ├── property-dependencies.ts       # Dependency analysis
│   ├── type-structure-service.ts      # Type structure validation
│   ├── expression-validator.ts        # n8n expression syntax validation
│   ├── expression-format-validator.ts # Expression format checking
│   ├── universal-expression-validator.ts # Combined expression validation
│   ├── workflow-validator.ts          # Complete workflow validation
│   ├── workflow-auto-fixer.ts         # Auto-generates fix operations for validation errors
│   ├── workflow-diff-engine.ts        # Diff-based workflow update engine
│   ├── workflow-versioning-service.ts # Workflow version management
│   ├── breaking-change-detector.ts    # Detects breaking changes between node versions
│   ├── breaking-changes-registry.ts   # Registry of known breaking changes
│   ├── node-version-service.ts        # Node version management
│   ├── node-migration-service.ts      # Node migration between versions
│   ├── node-documentation-service.ts  # Node documentation enrichment
│   ├── node-similarity-service.ts     # Finds similar nodes
│   ├── node-sanitizer.ts              # Sanitizes node data
│   ├── operation-similarity-service.ts # Finds similar operations
│   ├── resource-similarity-service.ts # Finds similar resources
│   ├── confidence-scorer.ts           # Scores suggestion confidence
│   ├── ai-node-validator.ts           # AI-specific node validation
│   ├── ai-tool-validators.ts          # AI tool validators
│   ├── tool-variant-generator.ts      # Generates AI tool variants
│   ├── n8n-api-client.ts              # n8n REST API client
│   ├── n8n-validation.ts              # n8n API-level validation
│   ├── n8n-version.ts                 # n8n version utilities
│   ├── execution-processor.ts         # Workflow execution processing
│   ├── error-execution-processor.ts   # Error execution handling
│   ├── post-update-validator.ts       # Post-update validation
│   └── sqlite-storage-service.ts      # SQLite storage abstraction
├── types/
│   ├── index.ts                # Type barrel exports
│   ├── type-structures.ts      # Type structure definitions
│   ├── instance-context.ts     # Multi-tenant instance configuration
│   ├── session-state.ts        # Session persistence types
│   ├── n8n-api.ts              # n8n API type definitions
│   ├── node-types.ts           # Node type definitions
│   └── workflow-diff.ts        # Workflow diff operation types
├── constants/
│   └── type-structures.ts      # 22 complete type structures
├── templates/
│   ├── template-fetcher.ts     # Fetches templates from n8n.io API
│   ├── template-repository.ts  # Template database operations
│   └── template-service.ts     # Template business logic
├── community/
│   ├── community-node-fetcher.ts    # Fetches community nodes from npm/Strapi
│   ├── community-node-service.ts    # Community node sync and management
│   ├── documentation-batch-processor.ts # Batch process docs generation
│   ├── documentation-generator.ts  # Generates AI-readable node docs
│   └── index.ts                # Module exports
├── telemetry/
│   ├── telemetry-manager.ts    # Central telemetry coordinator
│   ├── config-manager.ts       # Telemetry configuration
│   ├── event-tracker.ts        # Tracks telemetry events
│   ├── event-validator.ts      # Validates event data
│   ├── mutation-tracker.ts     # Tracks workflow mutations
│   ├── mutation-types.ts       # Mutation type definitions
│   ├── mutation-validator.ts   # Validates mutations
│   ├── intent-classifier.ts    # Classifies user intents
│   ├── intent-sanitizer.ts     # Sanitizes intent data
│   ├── workflow-sanitizer.ts   # Sanitizes workflow data before telemetry
│   ├── error-sanitizer.ts      # Sanitizes error data
│   ├── error-sanitization-utils.ts # Error sanitization helpers
│   ├── early-error-logger.ts   # Captures pre-telemetry errors
│   ├── performance-monitor.ts  # Performance measurement
│   ├── rate-limiter.ts         # Telemetry rate limiting
│   ├── startup-checkpoints.ts  # Tracks startup phase completion
│   ├── batch-processor.ts      # Batches telemetry events
│   ├── telemetry-error.ts      # Telemetry-specific errors
│   ├── telemetry-types.ts      # Type definitions
│   └── index.ts                # Module exports
├── triggers/
│   ├── trigger-detector.ts     # Detects trigger nodes in workflows
│   ├── trigger-registry.ts     # Registry of supported trigger types
│   ├── types.ts                # Trigger type definitions
│   ├── handlers/
│   │   ├── base-handler.ts     # Base trigger handler
│   │   ├── chat-handler.ts     # Chat trigger handler
│   │   ├── form-handler.ts     # Form trigger handler
│   │   └── webhook-handler.ts  # Webhook trigger handler
│   └── index.ts                # Module exports
├── config/
│   └── n8n-api.ts              # n8n API configuration (zod-validated)
├── errors/
│   └── validation-service-error.ts # Validation service error types
├── data/
│   └── canonical-ai-tool-examples.json # Canonical examples for AI tools
├── n8n/
│   ├── MCPApi.credentials.ts   # MCP API credentials node
│   └── MCPNode.node.ts         # MCP integration node for n8n
├── scripts/
│   ├── rebuild.ts              # Database rebuild with validation
│   ├── rebuild-optimized.ts    # Optimized database rebuild
│   ├── rebuild-database.ts     # Alternative database rebuild
│   ├── validate.ts             # Node validation
│   ├── fetch-templates.ts      # Fetch workflow templates from n8n.io
│   ├── fetch-templates-robust.ts # Robust template fetching with retries
│   ├── fetch-community-nodes.ts # Fetch community nodes
│   ├── generate-community-docs.ts # Generate community node docs
│   ├── sanitize-templates.ts   # Sanitize template data
│   ├── seed-canonical-ai-examples.ts # Seed canonical AI examples
│   ├── migrate-readme-columns.ts # Migrate README column data
│   └── [various test scripts]  # Individual feature test scripts
├── mcp/
│   ├── server.ts               # MCP server with all tool handlers
│   ├── tools.ts                # Core tool definitions
│   ├── tools-n8n-manager.ts    # n8n workflow management tool definitions
│   ├── tools-n8n-friendly.ts   # n8n-friendly tool name adapters
│   ├── handlers-n8n-manager.ts # Handlers for n8n management operations
│   ├── handlers-workflow-diff.ts # Handlers for diff-based workflow updates
│   ├── tools-documentation.ts  # Tool documentation system
│   ├── workflow-examples.ts    # Workflow example strings
│   ├── stdio-wrapper.ts        # stdio transport wrapper
│   ├── tool-docs/              # Structured tool documentation by category
│   │   ├── configuration/
│   │   ├── discovery/
│   │   ├── guides/
│   │   ├── system/
│   │   ├── templates/
│   │   ├── validation/
│   │   └── workflow_management/
│   ├── ui/                     # MCP Apps (rich HTML UIs)
│   │   ├── app-configs.ts
│   │   ├── registry.ts
│   │   ├── types.ts
│   │   └── index.ts
│   └── index.ts                # Main entry point with mode selection
├── utils/
│   ├── auth.ts                 # Authentication utilities
│   ├── bridge.ts               # Bridge utilities
│   ├── cache-utils.ts          # Cache utilities
│   ├── console-manager.ts      # Console output isolation
│   ├── documentation-fetcher.ts # Fetches node documentation
│   ├── enhanced-documentation-fetcher.ts # Enhanced doc fetching
│   ├── error-handler.ts        # Error handling utilities
│   ├── example-generator.ts    # Example generation utilities
│   ├── expression-utils.ts     # Expression utility functions
│   ├── fixed-collection-validator.ts # Fixed collection validation
│   ├── logger.ts               # Logging utility with HTTP awareness
│   ├── mcp-client.ts           # MCP client utility
│   ├── n8n-errors.ts           # n8n-specific error types
│   ├── node-classification.ts  # Node classification helpers
│   ├── node-source-extractor.ts # Extracts source from nodes
│   ├── node-type-normalizer.ts # Normalizes node type names
│   ├── node-type-utils.ts      # Node type utilities
│   ├── node-utils.ts           # General node utilities
│   ├── npm-version-checker.ts  # Checks npm package versions
│   ├── protocol-version.ts     # MCP protocol version negotiation
│   ├── simple-cache.ts         # Simple in-memory cache
│   ├── ssrf-protection.ts      # SSRF attack protection
│   ├── template-node-resolver.ts # Resolves node types in templates
│   ├── template-sanitizer.ts   # Sanitizes template data
│   ├── url-detector.ts         # URL detection utilities
│   ├── validation-schemas.ts   # Zod validation schemas
│   └── version.ts              # Project version constant
├── http-server-single-session.ts  # Single-session HTTP/SSE server
│                                   # Includes session persistence API
├── http-server.ts              # DEPRECATED: old fixed HTTP server (do not use)
├── mcp-engine.ts               # Simplified MCP engine for service integration
│                                # Includes session persistence wrappers
├── mcp-tools-engine.ts         # Simplified MCP engine for benchmarking
└── index.ts                    # Library exports

ui-apps/                        # MCP Apps frontend (Vite/TypeScript)
├── src/                        # React/TS UI source
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Common Development Commands

```bash
# Build and Setup
npm run build          # Build TypeScript (always run after changes)
npm run build:ui       # Build MCP Apps UI (ui-apps/)
npm run build:all      # Build UI then TypeScript
npm run rebuild        # Rebuild node database from n8n packages
npm run rebuild:optimized  # Optimized database rebuild
npm run validate       # Validate all node data in database

# Testing
npm test               # Run all tests (vitest)
npm run test:run       # Run tests once (no watch)
npm run test:unit      # Run unit tests only
npm run test:integration # Run integration tests
npm run test:e2e       # Run end-to-end tests
npm run test:coverage  # Run tests with coverage report
npm run test:watch     # Run tests in watch mode
npm run test:ci        # Run tests for CI with JUnit reporter

# Run a single test file
npm test -- tests/unit/services/property-filter.test.ts

# Benchmarks
npm run benchmark      # Run benchmarks
npm run benchmark:ci   # Run benchmarks in CI mode

# Linting and Type Checking
npm run lint           # Check TypeScript types (alias for typecheck)
npm run typecheck      # Check TypeScript types

# Running the Server
npm start              # Start MCP server in stdio mode
npm run start:http     # Start MCP server in HTTP/SSE mode
npm run start:n8n      # Start in n8n integration mode (HTTP + N8N_MODE)
npm run dev            # Build, rebuild database, and validate
npm run dev:http       # Run HTTP server with auto-reload

# Update n8n Dependencies
npm run update:n8n:check  # Check for n8n updates (dry run)
npm run update:n8n        # Update n8n packages to latest

# Database Management
npm run db:rebuild     # Rebuild database from scratch
npm run db:init        # Initialize a fresh database
npm run migrate:fts5   # Migrate to FTS5 search (if needed)

# Template Management
npm run fetch:templates         # Fetch latest workflow templates from n8n.io
npm run fetch:templates:update  # Update existing templates
npm run fetch:templates:robust  # Fetch with retry logic
npm run test:templates          # Test template functionality

# Community Node Management
npm run fetch:community           # Fetch community nodes
npm run fetch:community:verified  # Fetch only verified community nodes
npm run fetch:community:update    # Update community node data
npm run generate:docs             # Generate community node documentation
npm run generate:docs:incremental # Incremental doc generation
npm run generate:docs:stats       # Show doc generation stats

# Release Management
npm run sync:runtime-version  # Sync runtime version constant
npm run update:readme-version # Update README version badge
npm run prepare:release       # Prepare a release
```

## High-Level Architecture

### Core Components

1. **MCP Server** (`mcp/server.ts`)
   - Implements Model Context Protocol for AI assistants
   - Provides tools for searching, validating, and managing n8n nodes
   - Supports stdio (Claude Desktop), HTTP/SSE, and n8n integration modes
   - Includes MCP Apps (rich HTML UIs) via `mcp/ui/`
   - Protocol version negotiation handled in `utils/protocol-version.ts`

2. **Database Layer** (`database/`)
   - SQLite database storing all n8n node information
   - Universal adapter pattern supporting both better-sqlite3 and sql.js
   - Full-text search capabilities with FTS5
   - Shared database state to prevent per-session memory leaks

3. **Node Processing Pipeline**
   - **Loader** (`loaders/node-loader.ts`): Loads nodes from n8n packages
   - **Parser** (`parsers/node-parser.ts`): Extracts node metadata and structure
   - **Property Extractor** (`parsers/property-extractor.ts`): Deep property analysis
   - **Docs Mapper** (`mappers/docs-mapper.ts`): Maps external documentation

4. **Service Layer** (`services/`)
   - **Property Filter**: Reduces node properties to AI-friendly essentials
   - **Config Validator**: Multi-profile validation system
   - **Type Structure Service**: Validates complex type structures (filter, resourceMapper, etc.)
   - **Expression Validator**: Validates n8n expression syntax
   - **Workflow Validator**: Complete workflow structure validation
   - **Workflow Auto-Fixer**: Generates diff operations to fix validation errors automatically
   - **Breaking Change Detector**: Identifies breaking changes between node versions
   - **Similarity Services**: Finds similar nodes, operations, and resources for suggestions
   - **Confidence Scorer**: Scores suggestion quality

5. **Template System** (`templates/`)
   - Fetches and stores workflow templates from n8n.io
   - Provides pre-built workflow examples
   - Supports template search and validation

6. **Community Node System** (`community/`)
   - Fetches community nodes from npm and Strapi API
   - Generates AI-readable documentation for community nodes
   - Supports incremental sync and update workflows

7. **Telemetry System** (`telemetry/`)
   - Anonymous usage statistics (opt-in)
   - Tracks tool usage, mutations, and performance
   - Sanitizes all data before transmission (no PII or credentials)
   - Rate limiting and batch processing

8. **Trigger System** (`triggers/`)
   - Detects webhook, form, and chat triggers in workflows
   - Handles external workflow execution via trigger endpoints
   - Used by `n8n_test_workflow` tool

9. **n8n Integration Nodes** (`n8n/`)
   - `MCPNode.node.ts`: n8n node that connects to MCP servers
   - `MCPApi.credentials.ts`: Credential type for MCP API authentication

### Key Design Patterns

1. **Repository Pattern**: All database operations go through repository classes
2. **Service Layer**: Business logic separated from data access
3. **Validation Profiles**: Different validation strictness levels (minimal, runtime, ai-friendly, strict)
4. **Diff-Based Updates**: Efficient workflow updates using operation diffs (saves 80-90% tokens)
5. **Shared Database**: Single database instance shared across sessions to prevent memory leaks
6. **Zod Validation**: All external inputs validated with Zod schemas

### MCP Tools Architecture

The MCP server exposes tools in several categories:

1. **Discovery Tools**: Finding and exploring nodes (`search_nodes`, `list_nodes`, etc.)
2. **Configuration Tools**: Getting node details and examples (`get_node_info`, `get_node_essentials`, etc.)
3. **Validation Tools**: Validating configurations before deployment
4. **Workflow Tools**: Complete workflow validation and auto-fix
5. **Management Tools**: Creating and updating workflows (requires n8n API config)
6. **Template Tools**: Searching and retrieving workflow templates
7. **Community Tools**: Accessing community node information
8. **Documentation Tools**: Accessing tool documentation and guides

### HTTP Server Architecture

- **Primary**: `http-server-single-session.ts` - SSE-based streaming, session persistence
- **Deprecated**: `http-server.ts` - Old fixed HTTP server, do not use
- **n8n Mode**: `N8N_MODE=true` enables n8n-specific tool naming conventions
- **Session management**: Supports multi-tenant deployments with export/restore API

## Memories and Notes for Development

### Development Workflow Reminders
- When you make changes to MCP server, you need to ask the user to reload it before you test
- When the user asks to review issues, you should use GH CLI to get the issue and all the comments
- When the task can be divided into separated subtasks, you should spawn separate sub-agents to handle them in parallel
- Use the best sub-agent for the task as per their descriptions

### Testing Best Practices
- Always run `npm run build` before testing changes
- Use `npm run dev` to rebuild database after package updates
- Check coverage with `npm run test:coverage`
- Integration tests require a clean database state
- Use `vitest` as the test runner (not Jest)

### Common Pitfalls
- The MCP server needs to be reloaded in Claude Desktop after changes
- HTTP mode requires proper CORS and auth token configuration
- Database rebuilds can take 2-3 minutes due to n8n package size
- Always validate workflows before deployment to n8n
- `http-server.ts` is deprecated - always use `http-server-single-session.ts`
- The shared database (`database/shared-database.ts`) prevents per-session memory leaks; do not bypass it

### Performance Considerations
- Use `get_node_essentials()` instead of `get_node_info()` for faster responses
- Batch validation operations when possible
- The diff-based update system saves 80-90% tokens on workflow updates
- Use `SimpleCache` from `utils/simple-cache.ts` for caching expensive operations

### Agent Interaction Guidelines
- Sub-agents are not allowed to spawn further sub-agents
- When you use sub-agents, do not allow them to commit and push. That should be done by you

### Development Best Practices
- Run typecheck and lint after every code change
- All external inputs must be validated with Zod schemas
- SSRF protection is implemented in `utils/ssrf-protection.ts` - use it for any outbound HTTP

### Session Persistence Feature (v2.24.1+)

**Location:**
- Types: `src/types/session-state.ts`
- Implementation: `src/http-server-single-session.ts`
- Wrapper: `src/mcp-engine.ts`
- Tests: `tests/unit/http-server/session-persistence.test.ts`, `tests/unit/mcp-engine/session-persistence.test.ts`

**Key Features:**
- **Export/Restore API**: `exportSessionState()` and `restoreSessionState()` methods
- **Multi-tenant support**: Enables zero-downtime deployments for SaaS platforms
- **Security-first**: API keys exported as plaintext - downstream MUST encrypt
- **Dormant sessions**: Restored sessions recreate transports on first request
- **Automatic expiration**: Respects `sessionTimeout` setting (default 30 min)
- **MAX_SESSIONS limit**: Caps at 100 concurrent sessions (configurable via `N8N_MCP_MAX_SESSIONS` env var)

**Important Implementation Notes:**
- Only exports sessions with valid n8nApiUrl and n8nApiKey in context
- Skips expired sessions during both export and restore
- Uses `validateInstanceContext()` for data integrity checks
- Transport and server objects are NOT persisted (recreated on-demand)

### Telemetry System

- Anonymous, opt-in usage statistics
- Configured via `TelemetryConfigManager` - respects `DO_NOT_TRACK` env var
- All data sanitized before sending: no PII, no credentials, no workflow content
- Startup checkpoints tracked in `telemetry/startup-checkpoints.ts`
- Rate limiting prevents telemetry from impacting performance

### Workflow Auto-Fix Feature

- `services/workflow-auto-fixer.ts` generates diff operations to fix validation errors
- Works with `services/breaking-change-detector.ts` for version-related fixes
- Used by `n8n_autofix_workflow` MCP tool
- Outputs `WorkflowDiffOperation[]` that can be applied via the diff engine

### MCP Apps (Rich UIs)

- Located in `src/mcp/ui/` (registry and configs) and `ui-apps/` (frontend source)
- Build with `npm run build:ui` before `npm run build`
- Apps are served as MCP resources with `text/html;profile=mcp-app` MIME type
- Only rendered in Claude.ai and compatible clients

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
- When you make changes to MCP server, you need to ask the user to reload it before you test
- When the user asks to review issues, you should use GH CLI to get the issue and all the comments
- When the task can be divided into separated subtasks, you should spawn separate sub-agents to handle them in parallel
- Use the best sub-agent for the task as per their descriptions
- Do not use hyperbolic or dramatic language in comments and documentation
- Add to every commit and PR: Conceived by Romuald Członkowski - and then link to www.aiadvisors.pl/en. Don't add it in conversations
