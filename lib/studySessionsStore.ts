
//  sessions are user scoped, so logout shows default and users dont see each other's sessions.

export type StudySession = {
    id: string;
    createdAt: number;       // when saved
    durationSeconds: number; // session length
};

export const SESSIONS_UPDATED_EVENT = "studywiz_sessions_updated";

// Base key stays the same, but we append the user's email
const STORAGE_BASE = "studywiz_sessions_v1";

function safeUserKey(email: string) {
    return email.trim().toLowerCase();
}

function storageKey(email: string) {
    return `${STORAGE_BASE}__${safeUserKey(email)}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export function loadSessions(email: string): StudySession[] {
    const raw = window.localStorage.getItem(storageKey(email));
    const list = safeParse<StudySession[]>(raw, []);
    return Array.isArray(list) ? list : [];
}

export function saveSession(email: string, durationSeconds: number, createdAt = Date.now()) {
    const next: StudySession = {
        id: `${createdAt}_${Math.random().toString(16).slice(2)}`,
        createdAt,
        durationSeconds,
    };

    const prev = loadSessions(email);
    const merged = [next, ...prev];

    window.localStorage.setItem(storageKey(email), JSON.stringify(merged));

    //lets Overview refresh instantly without page reload
    window.dispatchEvent(new CustomEvent(SESSIONS_UPDATED_EVENT));
}

export function clearSessions(email: string) {
    window.localStorage.removeItem(storageKey(email));
    window.dispatchEvent(new CustomEvent(SESSIONS_UPDATED_EVENT));
}

export function sessionMinutes(s: StudySession) {
    return Math.max(0, Math.floor((s?.durationSeconds || 0) / 60));
}

export function sessionTimestamp(s: StudySession) {
    return typeof s?.createdAt === "number" ? s.createdAt : 0;
}
