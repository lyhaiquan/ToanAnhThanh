---
type: community
cohesion: 0.29
members: 7
---

# Security & Monitoring Design

**Cohesion:** 0.29 - loosely connected
**Members:** 7 nodes

## Members
- [[ACTIVITY_LABELS (Vietnamese labels)]] - code - packages/shared/src/index.ts
- [[ActivityLog  SecurityEvent Monitoring]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[ActivityType Union Type]] - code - packages/shared/src/index.ts
- [[Client Security Guard (Web Deterrents)]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[Electron setContentProtection]] - rationale - docs/superpowers/specs/2026-07-06-toan-anh-thanh-lms-design.md
- [[SECURITY_EVENT_LABELS (Vietnamese labels)]] - code - packages/shared/src/index.ts
- [[SecurityEventType Union Type]] - code - packages/shared/src/index.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Security__Monitoring_Design
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Adapter Architecture (AI + Storage)]]

## Top bridge nodes
- [[Client Security Guard (Web Deterrents)]] - degree 4, connects to 1 community
- [[Electron setContentProtection]] - degree 2, connects to 1 community