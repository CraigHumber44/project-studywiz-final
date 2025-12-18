export type LibraryFile = {
    id: string;
    ownerKey: string; // user email normalized
    name: string;
    type: string;
    size: number;
    uploadedAt: number;
    blob: Blob;
};

type LibraryRow = {
    id: string;
    ownerKey: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: number;
};

const DB_NAME = "studywiz_library";
const DB_VERSION = 2;
const STORE = "files";
const OWNER_INDEX = "ownerKey";

function normalizeOwnerKey(ownerKey: string) {
    return String(ownerKey || "").trim().toLowerCase();
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = () => {
            const db = req.result;

            let store: IDBObjectStore;
            if (!db.objectStoreNames.contains(STORE)) {
                store = db.createObjectStore(STORE, { keyPath: "id" });
            } else {
                store = req.transaction!.objectStore(STORE);
            }

            // Add owner index for per-user queries
            if (!store.indexNames.contains(OWNER_INDEX)) {
                store.createIndex(OWNER_INDEX, "ownerKey", { unique: false });
            }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function makeId(ownerKey: string) {
    return `${ownerKey}:${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function addFile(file: File, ownerKey: string): Promise<LibraryRow> {
    const ok = normalizeOwnerKey(ownerKey);
    if (!ok) throw new Error("Missing ownerKey");

    const db = await openDB();

    const record: LibraryFile = {
        id: makeId(ok),
        ownerKey: ok,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        uploadedAt: Date.now(),
        blob: file,
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.oncomplete = () =>
            resolve({
                id: record.id,
                ownerKey: record.ownerKey,
                name: record.name,
                type: record.type,
                size: record.size,
                uploadedAt: record.uploadedAt,
            });
        tx.onerror = () => reject(tx.error);

        tx.objectStore(STORE).put(record);
    });
}

export async function getFile(id: string, ownerKey: string): Promise<LibraryFile | null> {
    const ok = normalizeOwnerKey(ownerKey);
    if (!ok) return null;

    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        tx.onerror = () => reject(tx.error);

        const req = tx.objectStore(STORE).get(id);
        req.onsuccess = () => {
            const rec = req.result as LibraryFile | undefined;
            if (!rec) return resolve(null);
            if (rec.ownerKey !== ok) return resolve(null);
            resolve(rec);
        };
        req.onerror = () => reject(req.error);
    });
}

export async function listFiles(ownerKey: string): Promise<LibraryRow[]> {
    const ok = normalizeOwnerKey(ownerKey);
    if (!ok) return [];

    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        tx.onerror = () => reject(tx.error);

        const store = tx.objectStore(STORE);

        // Prefer index query (fast)
        if (store.indexNames.contains(OWNER_INDEX)) {
            const idx = store.index(OWNER_INDEX);
            const range = IDBKeyRange.only(ok);
            const req = idx.getAll(range);

            req.onsuccess = () => {
                const rows = (req.result as LibraryFile[]).map((r) => ({
                    id: r.id,
                    ownerKey: r.ownerKey,
                    name: r.name,
                    type: r.type,
                    size: r.size,
                    uploadedAt: r.uploadedAt,
                }));
                // newest first
                rows.sort((a, b) => b.uploadedAt - a.uploadedAt);
                resolve(rows);
            };
            req.onerror = () => reject(req.error);
            return;
        }

        // Fallback (older DB), filter in memory
        const req = store.getAll();
        req.onsuccess = () => {
            const all = (req.result as LibraryFile[]) || [];
            const rows = all
                .filter((r) => r.ownerKey === ok)
                .map((r) => ({
                    id: r.id,
                    ownerKey: r.ownerKey,
                    name: r.name,
                    type: r.type,
                    size: r.size,
                    uploadedAt: r.uploadedAt,
                }))
                .sort((a, b) => b.uploadedAt - a.uploadedAt);

            resolve(rows);
        };
        req.onerror = () => reject(req.error);
    });
}

export async function removeFile(id: string, ownerKey: string): Promise<boolean> {
    const ok = normalizeOwnerKey(ownerKey);
    if (!ok) return false;

    const db = await openDB();

    // Only delete if it belongs to that user
    const rec = await getFile(id, ok);
    if (!rec) return false;

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);

        tx.objectStore(STORE).delete(id);
    });
}
