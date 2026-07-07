---
source_file: "apps/server/prisma/schema.prisma"
type: "code"
community: "Server Module Wiring"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/Server_Module_Wiring
---

# User Model

## Connections
- [[Analytics Router]] - `shares_data_with` [EXTRACTED]
- [[Device Binding Migration]] - `references` [EXTRACTED]
- [[MockAIProvider_2]] - `shares_data_with` [INFERRED]
- [[Prisma Seed Script]] - `shares_data_with` [EXTRACTED]
- [[login Service]] - `shares_data_with` [EXTRACTED]
- [[requireAuth Middleware]] - `shares_data_with` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/Server_Module_Wiring