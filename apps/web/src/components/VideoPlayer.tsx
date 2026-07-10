import { useEffect, useRef, useState } from 'react';
import { api, reportActivity } from '../lib/api';
import { useAuth } from '../lib/store';

/**
 * Video player bảo mật:
 * - src là endpoint stream + token ký ngắn hạn (xin mới trước mỗi lần play)
 * - watermark email + giờ, trôi ngẫu nhiên mỗi 4s
 * - chặn contextmenu + controlsList để ẩn nút download
 * - báo cáo play/pause/seek về server cho admin theo dõi
 */
export default function VideoPlayer({ lessonId }: { lessonId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const user = useAuth((s) => s.user);
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  const errorCount = useRef(0);
  const [wmPos, setWmPos] = useState({ top: '10%', left: '8%' });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let alive = true;
    errorCount.current = 0;
    setFailed(false);
    api.post(`/stream/token/${lessonId}`).then((r) => {
      if (alive) setSrc(`/api/stream/${lessonId}?token=${r.data.token}`);
    });
    return () => { alive = false; };
  }, [lessonId]);

  // Watermark trôi + cập nhật giờ
  useEffect(() => {
    const id = setInterval(() => {
      setWmPos({ top: `${8 + Math.random() * 72}%`, left: `${5 + Math.random() * 65}%` });
      setNow(new Date());
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Đếm thời gian xem, ghi nhận mỗi 15s
  useEffect(() => {
    const id = setInterval(() => {
      const v = videoRef.current;
      if (v && !v.paused && !v.ended) {
        api.post(`/progress/watch/${lessonId}`, { seconds: 15 }).catch(() => {});
      }
    }, 15000);
    return () => clearInterval(id);
  }, [lessonId]);

  async function retryWithFreshToken() {
    const v = videoRef.current;
    if (!v || !src) return;
    const t = v.currentTime;
    const r = await api.post(`/stream/token/${lessonId}`);
    v.src = `/api/stream/${lessonId}?token=${r.data.token}`;
    v.currentTime = t;
    v.play().catch(() => {});
  }

  if (failed)
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-ink-900/10 dark:border-white/10 bg-black/90 text-center shadow-note">
        <div className="text-5xl">📼</div>
        <p className="max-w-sm px-4 text-slate-300">
          Video bài này hiện chưa xem được. Em thử lại sau, hoặc báo thầy kiểm tra giúp nhé.
        </p>
        <button
          onClick={() => { errorCount.current = 0; setFailed(false); retryWithFreshToken(); }}
          className="btn-primary text-sm"
        >
          ↻ Thử lại
        </button>
      </div>
    );

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-ink-900/10 dark:border-white/10 bg-black shadow-note">
      <video
        ref={videoRef}
        src={src}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        className="aspect-video w-full"
        onContextMenu={(e) => e.preventDefault()}
        onPlaying={() => { errorCount.current = 0; }}
        onPlay={() => reportActivity('VIDEO_PLAY', { lessonId })}
        onPause={() => reportActivity('VIDEO_PAUSE', { lessonId })}
        onSeeked={() => reportActivity('VIDEO_SEEK', { lessonId, at: videoRef.current?.currentTime })}
        onEnded={() => reportActivity('VIDEO_ENDED', { lessonId })}
        onError={() => {
          // Token stream sống 60s nên hết hạn giữa chừng là bình thường → xin token
          // mới, giữ vị trí đang xem. Nhưng nếu lỗi liên tiếp (file mất, server lỗi)
          // thì dừng lại báo người dùng — retry vô hạn làm player nhấp nháy.
          if (!videoRef.current || !src) return;
          errorCount.current += 1;
          if (errorCount.current > 2) {
            setFailed(true);
            return;
          }
          retryWithFreshToken().catch(() => setFailed(true));
        }}
      />
      <div className="watermark" style={wmPos}>
        {user?.email} · {now.toLocaleTimeString('vi-VN')} · Toán Anh Thành
      </div>
    </div>
  );
}
