import * as FileSystem from 'expo-file-system/legacy';

const memory = new Map();
const DIR = `${FileSystem.documentDirectory ?? ''}favorite-images/`;

function fileNameFor(url) {
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-180);
}

export function resolveImage(url) {
  if (!url) return url;
  return memory.get(url) || url;
}

export function hydrateImageMap(images) {
  Object.entries(images ?? {}).forEach(([url, uri]) => {
    if (url && uri) memory.set(url, uri);
  });
}

async function ensureDir() {
  if (!FileSystem.documentDirectory) return;
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

export async function cacheImageUrls(urls) {
  const images = {};
  if (!FileSystem.documentDirectory) return images;

  await ensureDir();

  await Promise.all(
    (urls ?? []).map(async (url) => {
      if (!url) return;
      if (memory.has(url)) {
        images[url] = memory.get(url);
        return;
      }

      const path = DIR + fileNameFor(url);
      try {
        const existing = await FileSystem.getInfoAsync(path);
        if (existing.exists) {
          memory.set(url, path);
          images[url] = path;
          return;
        }

        const result = await FileSystem.downloadAsync(url, path);
        const uri = result.uri || path;
        memory.set(url, uri);
        images[url] = uri;
      } catch {
        // Keep the remote URL; offline will use the pokéball fallback.
      }
    }),
  );

  return images;
}

export async function deleteImageFiles(images) {
  await Promise.all(
    Object.values(images ?? {}).map((uri) =>
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {}),
    ),
  );
  Object.keys(images ?? {}).forEach((url) => memory.delete(url));
}
