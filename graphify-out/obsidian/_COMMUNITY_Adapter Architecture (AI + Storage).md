---
type: community
cohesion: 0.14
members: 19
---

# Adapter Architecture (AI + Storage)

**Cohesion:** 0.14 - loosely connected
**Members:** 19 nodes

## Members
- [[AIProvider Interface]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[Adapter Pattern for Volatile Subsystems]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[DEFAULT_PASS_SCORE = 70]] - code - packages/shared/src/index.ts
- [[Dynamic Moving Watermark]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[GoogleDriveProvider (stub)]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[HMAC Signed Stream Token]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[LocalStorageProvider]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[MockAIProvider]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[OpenNotebookProvider]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[Prisma Data Model (UserCourseChapterLessonQuizProgress)]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[Quiz Gate (Sequential Unlock)]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[RBAC (JWT + requireRole)]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[Role Type (ADMIN  STUDENT)]] - code - packages/shared/src/index.ts
- [[Root Monorepo Package (toan-anh-thanh-lms)]] - code - package.json
- [[Server Package (@tatserver)]] - code - apps/server/package.json
- [[Shared Package (@tatshared)]] - code - packages/shared/package.json
- [[StorageProvider Interface]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[Toan Anh Thanh LMS Design Spec]] - document - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[Toan Anh Thanh LMS Implementation Plan]] - document - docs/superpowers/plans/2026-07-06-toan-anh-thanh-lms.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Adapter_Architecture_AI__Storage
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Security & Monitoring Design]]

## Top bridge nodes
- [[Toan Anh Thanh LMS Implementation Plan]] - degree 10, connects to 1 community