// Định danh thiết bị cố định, lưu trong localStorage của máy.
// Mỗi máy/trình duyệt có một ID riêng — dùng để khóa 1 thiết bị/học sinh.
const KEY = 'tat-device-id';

export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
