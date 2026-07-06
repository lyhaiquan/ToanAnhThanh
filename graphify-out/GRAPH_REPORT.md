# Graph Report - D:/ToanAnhThanh  (2026-07-06)

## Corpus Check
- Corpus is ~2,109 words - fits in a single context window. You may not need a graph.

## Summary
- 98 nodes · 98 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.92)
- Token cost: 46,574 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Adapter Architecture (AI + Storage)|Adapter Architecture (AI + Storage)]]
- [[_COMMUNITY_Root Monorepo Config|Root Monorepo Config]]
- [[_COMMUNITY_Server Dev Dependencies|Server Dev Dependencies]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Server Package Scripts|Server Package Scripts]]
- [[_COMMUNITY_Server Runtime Dependencies|Server Runtime Dependencies]]
- [[_COMMUNITY_Security & Monitoring Design|Security & Monitoring Design]]
- [[_COMMUNITY_Shared Types Module|Shared Types Module]]
- [[_COMMUNITY_Shared Package Config|Shared Package Config]]
- [[_COMMUNITY_Claude Tool Settings|Claude Tool Settings]]

## God Nodes (most connected - your core abstractions)
1. `Toan Anh Thanh LMS Implementation Plan` - 10 edges
2. `compilerOptions` - 9 edges
3. `scripts` - 7 edges
4. `scripts` - 7 edges
5. `StorageProvider Interface` - 5 edges
6. `Toan Anh Thanh LMS Design Spec` - 4 edges
7. `AIProvider Interface` - 4 edges
8. `Client Security Guard (Web Deterrents)` - 4 edges
9. `Root Monorepo Package (toan-anh-thanh-lms)` - 3 edges
10. `Shared Package (@tat/shared)` - 3 edges

## Surprising Connections (you probably didn't know these)
- `RBAC (JWT + requireRole)` --shares_data_with--> `Role Type (ADMIN | STUDENT)`  [INFERRED]
  docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md → packages/shared/src/index.ts
- `ActivityLog / SecurityEvent Monitoring` --shares_data_with--> `ActivityType Union Type`  [INFERRED]
  docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md → packages/shared/src/index.ts
- `Client Security Guard (Web Deterrents)` --shares_data_with--> `SecurityEventType Union Type`  [INFERRED]
  docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md → packages/shared/src/index.ts
- `Quiz Gate (Sequential Unlock)` --shares_data_with--> `DEFAULT_PASS_SCORE = 70`  [INFERRED]
  docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md → packages/shared/src/index.ts
- `Toan Anh Thanh LMS Implementation Plan` --references--> `Root Monorepo Package (toan-anh-thanh-lms)`  [EXTRACTED]
  docs/superpowers/plans/2026-07-06-toan-anh-thanh-lms.md → package.json

## Hyperedges (group relationships)
- **Video Content Protection Defense-in-Depth** — design_stream_token, design_dynamic_watermark, design_client_security_guard, design_electron_content_protection, design_activity_logging [EXTRACTED 0.90]
- **Adapter Pattern Extensibility (AI + Storage)** — design_adapter_pattern, design_ai_provider_interface, design_mock_ai_provider, design_opennotebook_provider, design_storage_provider_interface, design_local_storage_provider, design_gdrive_provider [EXTRACTED 0.90]
- **Sequential Learning Gate Flow** — design_quiz_gate, design_prisma_data_model, shared_DEFAULT_PASS_SCORE [INFERRED 0.85]

## Communities (10 total, 1 thin omitted)

### Community 0 - "Adapter Architecture (AI + Storage)"
Cohesion: 0.14
Nodes (19): Adapter Pattern for Volatile Subsystems, AIProvider Interface, Dynamic Moving Watermark, GoogleDriveProvider (stub), LocalStorageProvider, MockAIProvider, OpenNotebookProvider, Prisma Data Model (User/Course/Chapter/Lesson/Quiz/Progress) (+11 more)

### Community 1 - "Root Monorepo Config"
Cohesion: 0.14
Nodes (13): devDependencies, concurrently, name, private, scripts, desktop, dev, dev:server (+5 more)

### Community 2 - "Server Dev Dependencies"
Cohesion: 0.15
Nodes (13): devDependencies, prisma, supertest, tsx, @types/bcryptjs, @types/cors, @types/express, @types/jsonwebtoken (+5 more)

### Community 3 - "TypeScript Config"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, module, moduleResolution, resolveJsonModule, skipLibCheck, strict, target (+2 more)

### Community 4 - "Server Package Scripts"
Cohesion: 0.20
Nodes (9): name, scripts, dev, fetch-media, migrate, seed, start, test (+1 more)

### Community 5 - "Server Runtime Dependencies"
Cohesion: 0.22
Nodes (9): dependencies, bcryptjs, cors, express, jsonwebtoken, multer, @prisma/client, @tat/shared (+1 more)

### Community 6 - "Security & Monitoring Design"
Cohesion: 0.29
Nodes (7): ActivityLog / SecurityEvent Monitoring, Client Security Guard (Web Deterrents), Electron setContentProtection, ACTIVITY_LABELS (Vietnamese labels), ActivityType Union Type, SECURITY_EVENT_LABELS (Vietnamese labels), SecurityEventType Union Type

### Community 7 - "Shared Types Module"
Cohesion: 0.29
Nodes (6): ACTIVITY_LABELS, ActivityType, Role, SECURITY_EVENT_LABELS, SecurityEventType, UserStatus

### Community 8 - "Shared Package Config"
Cohesion: 0.40
Nodes (4): main, name, types, version

## Knowledge Gaps
- **63 isolated node(s):** `name`, `private`, `version`, `workspaces`, `dev` (+58 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Server Dev Dependencies` to `Server Package Scripts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `Toan Anh Thanh LMS Implementation Plan` connect `Adapter Architecture (AI + Storage)` to `Security & Monitoring Design`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Server Runtime Dependencies` to `Server Package Scripts`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _68 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Adapter Architecture (AI + Storage)` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Should `Root Monorepo Config` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._