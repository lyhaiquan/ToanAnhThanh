---
type: community
cohesion: 0.14
members: 25
---

# Server Module Wiring

**Cohesion:** 0.14 - loosely connected
**Members:** 25 nodes

## Members
- [[AI Provider Adapter Pattern]] - rationale - apps/server/src/modules/ai/router.ts
- [[AI Router]] - code - apps/server/src/modules/ai/router.ts
- [[AIProvider Interface_1]] - code - apps/server/src/modules/ai/provider.ts
- [[ActivityLog Model]] - code - apps/server/prisma/schema.prisma
- [[Analytics Router]] - code - apps/server/src/modules/analytics/router.ts
- [[Auth Router]] - code - apps/server/src/modules/auth/router.ts
- [[Courses Router]] - code - apps/server/src/modules/courses/router.ts
- [[Device Binding (chống chia sẻ tài khoản)]] - rationale - apps/server/src/modules/auth/service.ts
- [[Device Binding Migration]] - code - apps/server/prisma/migrations/20260706174607_device_binding/migration.sql
- [[Express App Factory]] - code - apps/server/src/app.ts
- [[Fetch Sample Media Script]] - code - apps/server/scripts/fetch-media.ts
- [[JWT Token Signing]] - code - apps/server/src/modules/auth/service.ts
- [[MockAIProvider_2]] - code - apps/server/src/modules/ai/mock.ts
- [[OpenNotebookProvider_2]] - code - apps/server/src/modules/ai/opennotebook.ts
- [[Per-request device guard for students]] - rationale - apps/server/src/middleware/auth.ts
- [[Prisma Seed Script]] - code - apps/server/prisma/seed.ts
- [[Progress Router]] - code - apps/server/src/modules/progress/router.ts
- [[SecurityEvent Model]] - code - apps/server/prisma/schema.prisma
- [[Server Config]] - code - apps/server/src/config.ts
- [[User Model]] - code - apps/server/prisma/schema.prisma
- [[isLessonUnlocked (quiz gate)]] - code - apps/server/src/modules/quiz/service.ts
- [[login Service]] - code - apps/server/src/modules/auth/service.ts
- [[refresh Service]] - code - apps/server/src/modules/auth/service.ts
- [[requireAuth Middleware]] - code - apps/server/src/middleware/auth.ts
- [[requireRole Middleware]] - code - apps/server/src/middleware/auth.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Server_Module_Wiring
SORT file.name ASC
```
