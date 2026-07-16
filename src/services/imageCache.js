const IMAGE_CACHE_NAME = 'hajimi-image-assets-v1';
const pendingImageRequests = new Map();

function getImageUrl(imageId) {
    if (!imageId) throw new Error('Missing image id');
    return `/api/images/${encodeURIComponent(String(imageId))}`;
}

function canUsePersistentCache() {
    return typeof globalThis.caches !== 'undefined';
}

async function fetchImage(imageId) {
    const response = await fetch(getImageUrl(imageId), {
        credentials: 'same-origin',
        cache: 'force-cache',
    });

    if (!response.ok) throw new Error('图片读取失败');
    return response;
}

/**
 * Cache Storage survives logout, login and normal browser restarts. Image ids are
 * immutable Mongo ObjectIds, so the URL itself is a safe cache key.
 */
export async function getCachedImageResponse(imageId) {
    const imageUrl = getImageUrl(imageId);
    let cache = null;

    if (canUsePersistentCache()) {
        try {
            cache = await globalThis.caches.open(IMAGE_CACHE_NAME);
            const cached = await cache.match(imageUrl);
            if (cached) return cached;
        } catch {
            // Cache Storage may be unavailable in private/restricted browser modes.
        }
    }

    let pending = pendingImageRequests.get(imageUrl);
    if (!pending) {
        pending = (async () => {
            const response = await fetchImage(imageId);
            if (cache) await cache.put(imageUrl, response.clone()).catch(() => {});
            return response;
        })();
        pendingImageRequests.set(imageUrl, pending);
    }

    try {
        return (await pending).clone();
    } finally {
        if (pendingImageRequests.get(imageUrl) === pending) {
            pendingImageRequests.delete(imageUrl);
        }
    }
}

export async function getCachedImageBlob(imageId) {
    const response = await getCachedImageResponse(imageId);
    return response.blob();
}

export async function getCachedImageObjectUrl(imageId) {
    const blob = await getCachedImageBlob(imageId);
    return URL.createObjectURL(blob);
}

export async function removeCachedImage(imageId) {
    if (!imageId || !canUsePersistentCache()) return false;
    try {
        const cache = await globalThis.caches.open(IMAGE_CACHE_NAME);
        return cache.delete(getImageUrl(imageId));
    } catch {
        return false;
    }
}

export { IMAGE_CACHE_NAME };
