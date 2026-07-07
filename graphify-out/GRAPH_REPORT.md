# Graph Report - D:/ToanAnhThanh  (2026-07-07)

## Corpus Check
- Corpus is ~42,200 words - fits in a single context window. You may not need a graph.

## Summary
- 437 nodes · 664 edges · 30 communities (23 shown, 7 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.88)
- Token cost: 183,509 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Server Core & Routers|Server Core & Routers]]
- [[_COMMUNITY_Admin Web Pages|Admin Web Pages]]
- [[_COMMUNITY_AI Panel (Web)|AI Panel (Web)]]
- [[_COMMUNITY_Server Dependencies|Server Dependencies]]
- [[_COMMUNITY_Design Rationale & Security|Design Rationale & Security]]
- [[_COMMUNITY_Server Module Wiring|Server Module Wiring]]
- [[_COMMUNITY_Web Dependencies|Web Dependencies]]
- [[_COMMUNITY_Mock AI Provider|Mock AI Provider]]
- [[_COMMUNITY_Server Config & Storage|Server Config & Storage]]
- [[_COMMUNITY_Root Monorepo Config|Root Monorepo Config]]
- [[_COMMUNITY_Web TS Config|Web TS Config]]
- [[_COMMUNITY_Server TS Config|Server TS Config]]
- [[_COMMUNITY_Storage Adapter|Storage Adapter]]
- [[_COMMUNITY_OpenNotebook Provider|OpenNotebook Provider]]
- [[_COMMUNITY_AIPanel.tsx|AIPanel.tsx]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_gate.test.ts|gate.test.ts]]
- [[_COMMUNITY_seed.ts|seed.ts]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_streamtoken.test.ts|streamtoken.test.ts]]
- [[_COMMUNITY_fetch-media.ts|fetch-media.ts]]
- [[_COMMUNITY_auth.test.ts|auth.test.ts]]
- [[_COMMUNITY_App (web root)|App (web root)]]
- [[_COMMUNITY_main.js|main.js]]
- [[_COMMUNITY_Content Protection (anti scr|Content Protection (anti scr]]
- [[_COMMUNITY_securityRouter|securityRouter]]

## God Nodes (most connected - your core abstractions)
1. `api (axios client)` - 20 edges
2. `prisma` - 19 edges
3. `api` - 13 edges
4. `useAuth` - 13 edges
5. `requireAuth()` - 11 edges
6. `OpenNotebookProvider` - 10 edges
7. `compilerOptions` - 10 edges
8. `Toan Anh Thanh LMS Implementation Plan` - 10 edges
9. `compilerOptions` - 9 edges
10. `config` - 8 edges

## Surprising Connections (you probably didn't know these)
- `RBAC (JWT + requireRole)` --shares_data_with--> `Role Type (ADMIN | STUDENT)`  [INFERRED]
  docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md → packages/shared/src/index.ts
- `ActivityLog / SecurityEvent Monitoring` --shares_data_with--> `ActivityType Union Type`  [INFERRED]
  docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md → packages/shared/src/index.ts
- `Client Security Guard (Web Deterrents)` --shares_data_with--> `SecurityEventType Union Type`  [INFERRED]
  docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md → packages/shared/src/index.ts
- `Quiz Gate (Sequential Unlock)` --shares_data_with--> `DEFAULT_PASS_SCORE = 70`  [INFERRED]
  docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md → packages/shared/src/index.ts
- `README — Toán Anh Thành LMS` --references--> `Client Security Guard (chống F12/quay màn hình)`  [INFERRED]
  README.md → apps/web/src/security/guard.ts

## Hyperedges (group relationships)
- **Video Content Protection Defense-in-Depth** — design_stream_token, design_dynamic_watermark, design_client_security_guard, design_electron_content_protection, design_activity_logging [EXTRACTED 0.90]
- **Adapter Pattern Extensibility (AI + Storage)** — design_adapter_pattern, design_ai_provider_interface, design_mock_ai_provider, design_opennotebook_provider, design_storage_provider_interface, design_local_storage_provider, design_gdrive_provider [EXTRACTED 0.90]
- **Sequential Learning Gate Flow** — design_quiz_gate, design_prisma_data_model, shared_DEFAULT_PASS_SCORE [INFERRED 0.85]
- **AI Provider Adapter Pattern** — provider_AIProvider, mock_MockAIProvider, opennotebook_OpenNotebookProvider [EXTRACTED 1.00]
- **Device Binding Anti-Sharing Flow** — authService_login, auth_requireAuth, migration_deviceBinding [INFERRED 0.85]
- **Storage Adapter Pattern** — provider_StorageProvider, local_LocalStorageProvider, gdrive_GoogleDriveProvider [EXTRACTED 1.00]
- **Stream Token Security Flow** — streamrouter_streamRouter, streamtoken_signStreamToken, streamtoken_verifyStreamToken [INFERRED 0.85]
- **Quiz Gate Unlock Flow** — quizservice_isLessonUnlocked, quizservice_submitQuiz, quiz_gate_concept [INFERRED 0.85]
- **Lesson learning surface (video + AI + quiz)** — videoplayer_component, aipanel_component, quizpanel_component [EXTRACTED 1.00]
- **Content protection stack** — concept_security_guard, concept_video_watermark, concept_device_binding [INFERRED 0.85]
- **Admin monitoring/management surface** — dashboard_admindashboard, monitor_adminmonitor, students_adminstudents [INFERRED 0.85]

## Communities (30 total, 7 thin omitted)

### Community 0 - "Server Core & Routers"
Cohesion: 0.07
Nodes (48): aiRouter, analyticsRouter, sevenDaysAgo, authRouter, deviceLabel, loginSchema, parsed, login() (+40 more)

### Community 1 - "Admin Web Pages"
Cohesion: 0.06
Nodes (36): ChapterRow, CourseTree, LessonRow, Dash, StudentRow, Activity, SecEvent, Student (+28 more)

### Community 2 - "AI Panel (Web)"
Cohesion: 0.09
Nodes (34): AnalyzeTab, ChatTab, AIPanel, ExercisesTab, SlidesTab, api (axios client), doRefresh (token refresh interceptor), reportActivity (+26 more)

### Community 3 - "Server Dependencies"
Cohesion: 0.06
Nodes (32): dependencies, bcryptjs, cors, express, jsonwebtoken, multer, @prisma/client, @tat/shared (+24 more)

### Community 4 - "Design Rationale & Security"
Cohesion: 0.10
Nodes (26): ActivityLog / SecurityEvent Monitoring, Adapter Pattern for Volatile Subsystems, AIProvider Interface, Client Security Guard (Web Deterrents), Dynamic Moving Watermark, Electron setContentProtection, GoogleDriveProvider (stub), LocalStorageProvider (+18 more)

### Community 5 - "Server Module Wiring"
Cohesion: 0.14
Nodes (25): AI Provider Adapter Pattern, AI Router, Analytics Router, Express App Factory, Auth Router, login Service, refresh Service, JWT Token Signing (+17 more)

### Community 6 - "Web Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, axios, react, react-dom, react-router-dom, @tat/shared, zustand, devDependencies (+16 more)

### Community 7 - "Mock AI Provider"
Cohesion: 0.19
Nodes (10): findTopic(), GENERIC, MockAIProvider, Topic, TOPICS, AIProvider, ChatMessage, Exercise (+2 more)

### Community 8 - "Server Config & Storage"
Cohesion: 0.18
Nodes (6): config, app, GoogleDriveProvider, LocalStorageProvider, StorageProvider, VideoStream

### Community 9 - "Root Monorepo Config"
Cohesion: 0.14
Nodes (13): devDependencies, concurrently, name, private, scripts, desktop, dev, dev:server (+5 more)

### Community 10 - "Web TS Config"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 11 - "Server TS Config"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, module, moduleResolution, resolveJsonModule, skipLibCheck, strict, target (+2 more)

### Community 12 - "Storage Adapter"
Cohesion: 0.27
Nodes (10): GoogleDriveProvider, LocalStorageProvider, StorageProvider Interface, Storage Adapter (local/gdrive), getStorage, storageRouter (video upload), Stream Token (HMAC 60s), streamRouter (+2 more)

### Community 15 - "package.json"
Cohesion: 0.22
Nodes (8): devDependencies, electron, main, name, private, scripts, start, version

### Community 16 - "index.ts"
Cohesion: 0.29
Nodes (6): ACTIVITY_LABELS, ActivityType, Role, SECURITY_EVENT_LABELS, SecurityEventType, UserStatus

### Community 17 - "gate.test.ts"
Cohesion: 0.43
Nodes (6): Quiz Gate (Lesson Unlock), quizRouter, getOrderedLessons, isLessonCompleted, isLessonUnlocked, submitQuiz

### Community 18 - "seed.ts"
Cohesion: 0.50
Nodes (4): main(), prisma, Q, questions()

### Community 19 - "package.json"
Cohesion: 0.40
Nodes (4): main, name, types, version

### Community 20 - "streamtoken.test.ts"
Cohesion: 0.40
Nodes (4): forged, payload, [payload, sig], token

### Community 23 - "App (web root)"
Cohesion: 0.50
Nodes (4): App (web root), RequireAuth (route guard), installGuard (security guard), main.tsx (web entry)

## Knowledge Gaps
- **172 isolated node(s):** `name`, `private`, `version`, `workspaces`, `dev` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createApp()` connect `Server Dependencies` to `Server Core & Routers`, `Server Config & Storage`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Server Core & Routers` be split into smaller, more focused modules?**
  _Cohesion score 0.06826923076923076 - nodes in this community are weakly interconnected._
- **Should `Admin Web Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.05837173579109063 - nodes in this community are weakly interconnected._
- **Should `AI Panel (Web)` be split into smaller, more focused modules?**
  _Cohesion score 0.0944741532976827 - nodes in this community are weakly interconnected._
- **Should `Server Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `Design Rationale & Security` be split into smaller, more focused modules?**
  _Cohesion score 0.09846153846153846 - nodes in this community are weakly interconnected._