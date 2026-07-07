---
type: community
cohesion: 0.07
members: 65
---

# Server Core & Routers

**Cohesion:** 0.07 - loosely connected
**Members:** 65 nodes

## Members
- [[AuthUser]] - code - apps/server/src/middleware/auth.ts
- [[Request]] - code - apps/server/src/middleware/auth.ts
- [[aiRouter]] - code - apps/server/src/modules/ai/router.ts
- [[analyticsRouter]] - code - apps/server/src/modules/analytics/router.ts
- [[app_1]] - code - apps/server/test/auth.test.ts
- [[app_2]] - code - apps/server/test/device.test.ts
- [[app.ts]] - code - apps/server/src/app.ts
- [[auth.test.ts]] - code - apps/server/test/auth.test.ts
- [[auth.ts]] - code - apps/server/src/middleware/auth.ts
- [[authRouter]] - code - apps/server/src/modules/auth/router.ts
- [[chapters]] - code - apps/server/src/modules/courses/router.ts
- [[courseSchema]] - code - apps/server/src/modules/courses/router.ts
- [[coursesRouter]] - code - apps/server/src/modules/courses/router.ts
- [[createSchema]] - code - apps/server/src/modules/users/router.ts
- [[db.ts]] - code - apps/server/src/db.ts
- [[device.test.ts]] - code - apps/server/test/device.test.ts
- [[deviceLabel]] - code - apps/server/src/modules/auth/router.ts
- [[done]] - code - apps/server/src/modules/courses/router.ts
- [[gate.test.ts]] - code - apps/server/test/gate.test.ts
- [[getOrderedLessons()]] - code - apps/server/src/modules/quiz/service.ts
- [[getStorage()]] - code - apps/server/src/modules/storage/index.ts
- [[isLessonCompleted()]] - code - apps/server/src/modules/quiz/service.ts
- [[isLessonUnlocked()]] - code - apps/server/src/modules/quiz/service.ts
- [[lessonIds]] - code - apps/server/src/modules/courses/router.ts
- [[lessons]] - code - apps/server/src/modules/courses/router.ts
- [[login()]] - code - apps/server/src/modules/auth/service.ts
- [[login()_1]] - code - apps/server/test/device.test.ts
- [[loginSchema]] - code - apps/server/src/modules/auth/router.ts
- [[match]] - code - apps/server/src/modules/stream/router.ts
- [[parsed]] - code - apps/server/src/modules/auth/router.ts
- [[parsed_1]] - code - apps/server/src/modules/courses/router.ts
- [[parsed_2]] - code - apps/server/src/modules/users/router.ts
- [[payload]] - code - apps/server/src/modules/stream/router.ts
- [[prisma_2]] - code - apps/server/src/db.ts
- [[progressMap]] - code - apps/server/src/modules/courses/router.ts
- [[progressRouter]] - code - apps/server/src/modules/progress/router.ts
- [[quizRouter]] - code - apps/server/src/modules/quiz/router.ts
- [[refresh()]] - code - apps/server/src/modules/auth/service.ts
- [[requireAuth()]] - code - apps/server/src/middleware/auth.ts
- [[requireRole()]] - code - apps/server/src/middleware/auth.ts
- [[router.ts_1]] - code - apps/server/src/modules/analytics/router.ts
- [[router.ts_2]] - code - apps/server/src/modules/auth/router.ts
- [[router.ts_3]] - code - apps/server/src/modules/courses/router.ts
- [[router.ts_4]] - code - apps/server/src/modules/progress/router.ts
- [[router.ts_5]] - code - apps/server/src/modules/quiz/router.ts
- [[router.ts_6]] - code - apps/server/src/modules/security/router.ts
- [[router.ts_7]] - code - apps/server/src/modules/storage/router.ts
- [[router.ts_8]] - code - apps/server/src/modules/stream/router.ts
- [[router.ts_9]] - code - apps/server/src/modules/users/router.ts
- [[sec]] - code - apps/server/src/modules/progress/router.ts
- [[securityRouter]] - code - apps/server/src/modules/security/router.ts
- [[service.ts]] - code - apps/server/src/modules/auth/service.ts
- [[service.ts_1]] - code - apps/server/src/modules/quiz/service.ts
- [[sevenDaysAgo]] - code - apps/server/src/modules/analytics/router.ts
- [[signAccessToken()]] - code - apps/server/src/modules/auth/service.ts
- [[signRefreshToken()]] - code - apps/server/src/modules/auth/service.ts
- [[storage]] - code - apps/server/src/modules/stream/router.ts
- [[storageRouter]] - code - apps/server/src/modules/storage/router.ts
- [[streamRouter]] - code - apps/server/src/modules/stream/router.ts
- [[submitQuiz()]] - code - apps/server/src/modules/quiz/service.ts
- [[token]] - code - apps/server/src/modules/stream/router.ts
- [[upload]] - code - apps/server/src/modules/storage/router.ts
- [[userId]] - code - apps/server/src/modules/security/router.ts
- [[usersRouter]] - code - apps/server/src/modules/users/router.ts
- [[{ stream, contentType }]] - code - apps/server/src/modules/stream/router.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Server_Core__Routers
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Mock AI Provider]]
- 8 edges to [[_COMMUNITY_Server Config & Storage]]
- 3 edges to [[_COMMUNITY_Server Dependencies]]

## Top bridge nodes
- [[app.ts]] - degree 24, connects to 3 communities
- [[auth.ts]] - degree 19, connects to 2 communities
- [[db.ts]] - degree 19, connects to 1 community
- [[prisma_2]] - degree 19, connects to 1 community
- [[router.ts_8]] - degree 13, connects to 1 community