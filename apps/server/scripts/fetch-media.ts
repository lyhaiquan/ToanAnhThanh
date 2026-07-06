// Tải video mẫu công khai (Google sample videos, CC-BY) về apps/server/media/
// Dùng thay cho Google Drive khi chưa có credentials.
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const MEDIA_DIR = path.join(import.meta.dirname, '..', 'media');

// Mỗi sample có danh sách URL dự phòng — thử lần lượt đến khi tải được.
const SAMPLES: Record<string, string[]> = {
  'sample1.mp4': [
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4',
  ],
  'sample2.mp4': [
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4',
    'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
  ],
  'sample3.mp4': [
    'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_5MB.mp4',
    'https://filesamples.com/samples/video/mp4/sample_1280x720.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
  ],
};

async function main() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  for (const [name, urls] of Object.entries(SAMPLES)) {
    const dest = path.join(MEDIA_DIR, name);
    if (existsSync(dest)) {
      console.log(`✓ ${name} đã có, bỏ qua`);
      continue;
    }
    let ok = false;
    for (const url of urls) {
      console.log(`Đang tải ${name} từ ${new URL(url).host} ...`);
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        await pipeline(Readable.fromWeb(res.body as any), createWriteStream(dest));
        console.log(`✓ ${name}`);
        ok = true;
        break;
      } catch (e) {
        console.warn(`  thất bại: ${(e as Error).message}`);
      }
    }
    if (!ok) throw new Error(`Không tải được ${name} từ mọi nguồn`);
  }
  console.log('Xong. Video mẫu nằm trong apps/server/media/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
