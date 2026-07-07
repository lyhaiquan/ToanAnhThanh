---
source_file: "apps/server/src/modules/auth/service.ts"
type: "code"
community: "Server Module Wiring"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/Server_Module_Wiring
---

# login Service

## Connections
- [[ActivityLog Model]] - `shares_data_with` [EXTRACTED]
- [[Auth Router]] - `calls` [EXTRACTED]
- [[Device Binding (chống chia sẻ tài khoản)]] - `rationale_for` [INFERRED]
- [[JWT Token Signing]] - `calls` [EXTRACTED]
- [[SecurityEvent Model]] - `shares_data_with` [EXTRACTED]
- [[User Model]] - `shares_data_with` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/Server_Module_Wiring