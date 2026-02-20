export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('uncolympics_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('uncolympics_device_id', id);
  }
  return id;
}