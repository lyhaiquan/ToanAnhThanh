# Giám sát bất thường — Prometheus + Grafana

## Chạy (trên VPS đã cài Docker)

```bash
# 1. Đặt token cho endpoint metrics của LMS (apps/server/.env):
#      METRICS_TOKEN=chuoi-ngau-nhien-dai
#    rồi điền đúng token đó vào prometheus.yml (chỗ DIEN_METRICS_TOKEN_VAO_DAY)

# 2. Đặt mật khẩu Grafana rồi khởi động:
GRAFANA_ADMIN_PASSWORD='mat-khau-manh' docker compose up -d
```

- Grafana: `http://<vps>:3000` (user `admin`) — datasource Prometheus đã cắm sẵn.
- Cảnh báo đã cài sẵn trong `alerts.yml`: server down, dò mật khẩu (>30 login fail/5ph),
  spike sự kiện bảo mật, lỗi 5xx liên tục, log dồn ứ, API chậm, đĩa/RAM cạn.
  Xem tại Prometheus `http://127.0.0.1:9090/alerts` (SSH tunnel) hoặc import vào Grafana Alerting.

## Metrics LMS phát ra (endpoint `/metrics`)

| Metric | Ý nghĩa khi bất thường |
|---|---|
| `tat_login_failures_total{reason}` | tăng vọt = đang bị dò mật khẩu / credential stuffing |
| `tat_security_events_total{type}` | học sinh mở devtools / thử quay màn hình hàng loạt |
| `tat_http_request_duration_seconds` | p95 tăng = quá tải; đếm theo `status` 5xx = lỗi server |
| `tat_activity_buffer_size` | tăng mãi không về 0 = PostgreSQL nghẽn |
| `process_*`, `nodejs_*` | CPU/RAM/event-loop của chính app |

## Dashboard gợi ý (import trong Grafana)

- Node Exporter Full: ID **1860** (tài nguyên máy chủ)
- Tự vẽ cho LMS: 4 panel — req/s theo status, p95 latency, login failures, security events.

Chạy dev thử tại máy local: `docker compose up -d` trong thư mục này
(app chạy `npm run dev` sẵn ở :4000 — Prometheus scrape qua `host.docker.internal`).
