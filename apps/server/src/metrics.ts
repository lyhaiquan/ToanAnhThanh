import { Registry, collectDefaultMetrics, Histogram, Counter, Gauge } from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Metrics cho Prometheus — nguồn dữ liệu để phát hiện bất thường trên Grafana.
export const registry = new Registry();
collectDefaultMetrics({ register: registry }); // CPU, RAM, event loop lag...

export const httpDuration = new Histogram({
  name: 'tat_http_request_duration_seconds',
  help: 'Thời gian xử lý HTTP request',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 1, 3, 10],
  registers: [registry],
});

export const loginFailures = new Counter({
  name: 'tat_login_failures_total',
  help: 'Số lần đăng nhập thất bại (sai mật khẩu/bị khóa/sai thiết bị) — tăng vọt = đang bị dò',
  labelNames: ['reason'],
  registers: [registry],
});

export const securityEvents = new Counter({
  name: 'tat_security_events_total',
  help: 'Sự kiện bảo mật từ client (devtools, quay màn hình...)',
  labelNames: ['type'],
  registers: [registry],
});

export const activityBufferSize = new Gauge({
  name: 'tat_activity_buffer_size',
  help: 'Số activity log đang đệm chưa ghi DB — tăng mãi = DB có vấn đề',
  registers: [registry],
});

// Middleware đo mọi request. Route lấy theo pattern (req.route) để không nổ label.
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path ? req.baseUrl + req.route.path : req.baseUrl || 'static';
    end({ method: req.method, route, status: String(res.statusCode) });
  });
  next();
}

// GET /metrics — nếu đặt METRICS_TOKEN thì phải gửi kèm ?token= hoặc Bearer
export async function metricsHandler(req: Request, res: Response) {
  const required = process.env.METRICS_TOKEN;
  if (required) {
    const given = req.query.token ?? req.headers.authorization?.replace(/^Bearer /, '');
    if (given !== required) return res.status(403).json({ error: 'Sai metrics token' });
  }
  res.set('Content-Type', registry.contentType);
  res.send(await registry.metrics());
}
