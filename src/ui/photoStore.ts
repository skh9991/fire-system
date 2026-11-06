/** 교수 모드에서 넣은 사진을 이 기기의 IndexedDB에 저장합니다. */
const DB = 'fire-trainer', ST = 'photos';
function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const q = indexedDB.open(DB, 1);
    q.onupgradeneeded = () => q.result.createObjectStore(ST);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const r = fn(db.transaction(ST, mode).objectStore(ST));
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export const putPhoto = (name: string, blob: Blob) => tx('readwrite', s => s.put(blob, name));
export const delPhoto = (name: string) => tx('readwrite', s => s.delete(name));
export async function allPhotos(): Promise<Record<string, Blob>> {
  const keys = await tx('readonly', s => s.getAllKeys());
  const vals = await tx('readonly', s => s.getAll());
  return Object.fromEntries(keys.map((k, i) => [String(k), vals[i] as Blob]));
}
export async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file), k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', .86));
  } catch { return file; }
}
