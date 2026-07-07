---
type: community
cohesion: 0.27
members: 11
---

# Storage Adapter

**Cohesion:** 0.27 - loosely connected
**Members:** 11 nodes

## Members
- [[GoogleDriveProvider_1]] - code - apps/server/src/modules/storage/gdrive.ts
- [[LocalStorageProvider_2]] - code - apps/server/src/modules/storage/local.ts
- [[Storage Adapter (localgdrive)]] - rationale - apps/server/src/modules/storage/provider.ts
- [[StorageProvider Interface_1]] - code - apps/server/src/modules/storage/provider.ts
- [[Stream Token (HMAC 60s)]] - rationale - apps/server/src/modules/stream/router.ts
- [[getStorage]] - code - apps/server/src/modules/storage/index.ts
- [[signStreamToken]] - code - apps/server/src/modules/stream/token.ts
- [[storageRouter (video upload)]] - code - apps/server/src/modules/storage/router.ts
- [[streamRouter_1]] - code - apps/server/src/modules/stream/router.ts
- [[streamtoken.test.ts_1]] - code - apps/server/test/streamtoken.test.ts
- [[verifyStreamToken]] - code - apps/server/src/modules/stream/token.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Storage_Adapter
SORT file.name ASC
```
