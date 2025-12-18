"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Lang = "en" | "fr" | "es";

type User =
    | {
        name: string;
        email: string;
    }
    | null;

type TimeFrame = "1 Day" | "1 Week" | "1 Month" | null;
type TopicMode = "Single" | "Multiple" | null;
type Priority = "Priority 1" | "Priority 2" | "Priority 3" | null;

export type StudySelection = {
    timeFrame: TimeFrame;
    startDate: string;
    endDate: string;
    topicMode: TopicMode;
    topicCount: number | null;
    topicsText: string;
    coursesText: string;
    priority: Priority;
};

export type SavedStudy = {
    id: string;
    createdAt: number;
    selection: StudySelection;
    summary: string;

    // If a timer session gets saved, these get filled
    durationSeconds: number;
    endedAt: number;
};

type TimerStatus = "idle" | "running" | "paused" | "stopped";

type PendingSession = {
    durationSeconds: number;
    endedAt: number;
    selection: StudySelection;
};

type ThemeMode = "dark" | "light";

type AppSettings = {
    theme: ThemeMode;
    notificationsEnabled: boolean;
    autoPauseEnabled: boolean;
    autoPauseHours: number;
};

type AppContextValue = {
    lang: Lang;
    setLang: (lang: Lang) => void;

    user: User;
    login: (payload: { name: string; email: string }) => { ok: boolean; message: string };
    logout: () => void;

    currentSelection: StudySelection;
    setCurrentSelection: (next: StudySelection) => void;

    savedStudies: SavedStudy[];
    saveSelection: () => { ok: boolean; message: string; savedId?: string };
    resetSelection: () => void;

    selectedStudyId: string | null;
    selectSavedStudy: (id: string) => void;

    removeSavedStudy: (id: string) => void;
    studyAgain: (id: string) => { ok: boolean; message: string };

    timerStatus: TimerStatus;
    timerSeconds: number;
    startTimer: () => { ok: boolean; message?: string };
    pauseTimer: () => void;
    stopTimer: () => void;
    resetTimer: () => void;

    pendingSession: PendingSession | null;
    savePendingSession: () => { ok: boolean; message: string; savedId?: string };
    discardPendingSession: () => void;

    totalSecondsThisWeek: number;

    settings: AppSettings;
    setTheme: (theme: ThemeMode) => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    setAutoPauseEnabled: (enabled: boolean) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_SELECTION: StudySelection = {
    timeFrame: null,
    startDate: "",
    endDate: "",
    topicMode: null,
    topicCount: null,
    topicsText: "",
    coursesText: "",
    priority: null,
};

const DEFAULT_SETTINGS: AppSettings = {
    theme: "dark",
    notificationsEnabled: false,
    autoPauseEnabled: false,
    autoPauseHours: 3,
};

function buildSummary(sel: StudySelection) {
    const parts: string[] = [];

    if (sel.timeFrame) parts.push(sel.timeFrame);

    if (sel.startDate || sel.endDate) {
        parts.push(`${sel.startDate || "?"} to ${sel.endDate || "?"}`);
    }

    if (sel.topicMode) {
        if (sel.topicMode === "Single") parts.push("Single");
        if (sel.topicMode === "Multiple") parts.push(`Multiple (${sel.topicCount ?? "?"})`);
    }

    if (sel.priority) parts.push(sel.priority);

    const topicsShort = sel.topicsText.trim()
        ? sel.topicsText.trim().split(",").map((x) => x.trim()).filter(Boolean).slice(0, 3).join(", ")
        : "";

    if (topicsShort) parts.push(`Topics: ${topicsShort}`);

    return parts.length ? parts.join(" | ") : "Untitled study";
}

function makeId() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function startOfWeekMs(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

// User scoped keys (so users only see their own profile/studies)
function safeUserKey(email?: string) {
    return String(email || "").trim().toLowerCase();
}
function keyForUser(email: string, base: string) {
    return `studywiz_${base}__${safeUserKey(email)}`;
}

/* =========================
   Login binding registry
   ========================= */

const USERS_REGISTRY_KEY = "studywiz_users_registry";

type StoredUser = {
    name: string; // original casing
    email: string; // normalized email
    createdAt: number;
};

function normalize(str: string) {
    return String(str || "").trim().toLowerCase();
}

function loadUserRegistry(): Record<string, StoredUser> {
    try {
        const raw = window.localStorage.getItem(USERS_REGISTRY_KEY);
        return raw ? (JSON.parse(raw) as Record<string, StoredUser>) : {};
    } catch {
        return {};
    }
}

function saveUserRegistry(reg: Record<string, StoredUser>) {
    window.localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(reg));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>("en");
    const [user, setUser] = useState<User>(null);

    const [currentSelection, setCurrentSelection] = useState<StudySelection>(EMPTY_SELECTION);
    const [savedStudies, setSavedStudies] = useState<SavedStudy[]>([]);
    const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);

    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");

    const [pendingSession, setPendingSession] = useState<PendingSession | null>(null);

    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    // Load global settings and language once
    useEffect(() => {
        const savedLang = window.localStorage.getItem("studywiz_lang") as Lang | null;
        const savedUser = window.localStorage.getItem("studywiz_user");
        const savedSettings = window.localStorage.getItem("studywiz_settings");

        if (savedLang) setLangState(savedLang);

        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings) as Partial<AppSettings>;
                setSettings((prev) => ({
                    ...prev,
                    ...parsed,
                    autoPauseHours:
                        typeof parsed.autoPauseHours === "number" ? parsed.autoPauseHours : prev.autoPauseHours,
                }));
            } catch {
                setSettings(DEFAULT_SETTINGS);
            }
        }

        // Restore last logged-in user (only if it still matches the registry)
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser) as User;
                const email = safeUserKey(parsed?.email);
                const name = String(parsed?.name || "").trim();

                if (email && name) {
                    const reg = loadUserRegistry();
                    const existing = reg[email];

                    if (existing && normalize(existing.name) !== normalize(name)) {
                        // Session does not match registry, refuse restore
                        setUser(null);
                        window.localStorage.removeItem("studywiz_user");
                    } else {
                        setUser({ name, email });
                    }
                }
            } catch {
                setUser(null);
            }
        }
    }, []);

    // Persist lang
    useEffect(() => {
        window.localStorage.setItem("studywiz_lang", lang);
        document.documentElement.lang = lang;
    }, [lang]);

    // Persist settings and apply theme
    useEffect(() => {
        window.localStorage.setItem("studywiz_settings", JSON.stringify(settings));
        document.documentElement.setAttribute("data-theme", settings.theme);
    }, [settings]);

    // Load user-scoped data whenever user changes
    useEffect(() => {
        if (!user?.email) {
            // Logged out, default UI state
            setCurrentSelection(EMPTY_SELECTION);
            setSavedStudies([]);
            setSelectedStudyId(null);
            setTimerStatus("idle");
            setTimerSeconds(0);
            setPendingSession(null);
            return;
        }

        const email = user.email;

        const selectionKey = keyForUser(email, "current_selection");
        const listKey = keyForUser(email, "saved_studies");
        const selectedKey = keyForUser(email, "selected_study_id");

        const timerSecondsKey = keyForUser(email, "timer_seconds");
        const timerStatusKey = keyForUser(email, "timer_status");
        const pendingKey = keyForUser(email, "pending_session");

        const savedSelection = window.localStorage.getItem(selectionKey);
        const savedList = window.localStorage.getItem(listKey);
        const savedSelectedId = window.localStorage.getItem(selectedKey);

        const savedTimerSeconds = window.localStorage.getItem(timerSecondsKey);
        const savedTimerStatus = window.localStorage.getItem(timerStatusKey) as TimerStatus | null;
        const savedPending = window.localStorage.getItem(pendingKey);

        if (savedSelection) {
            try {
                setCurrentSelection(JSON.parse(savedSelection));
            } catch {
                setCurrentSelection(EMPTY_SELECTION);
            }
        } else {
            setCurrentSelection(EMPTY_SELECTION);
        }

        if (savedList) {
            try {
                const parsed = JSON.parse(savedList);
                setSavedStudies(Array.isArray(parsed) ? parsed : []);
            } catch {
                setSavedStudies([]);
            }
        } else {
            setSavedStudies([]);
        }

        setSelectedStudyId(savedSelectedId || null);

        setTimerSeconds(savedTimerSeconds ? Number(savedTimerSeconds) || 0 : 0);
        setTimerStatus(savedTimerStatus || "idle");

        if (savedPending) {
            try {
                setPendingSession(JSON.parse(savedPending));
            } catch {
                setPendingSession(null);
            }
        } else {
            setPendingSession(null);
        }
    }, [user?.email]);

    // Persist user-scoped data
    useEffect(() => {
        if (!user?.email) return;
        window.localStorage.setItem(keyForUser(user.email, "current_selection"), JSON.stringify(currentSelection));
    }, [currentSelection, user?.email]);

    useEffect(() => {
        if (!user?.email) return;
        window.localStorage.setItem(keyForUser(user.email, "saved_studies"), JSON.stringify(savedStudies));
    }, [savedStudies, user?.email]);

    useEffect(() => {
        if (!user?.email) return;
        const k = keyForUser(user.email, "selected_study_id");
        if (selectedStudyId) window.localStorage.setItem(k, selectedStudyId);
        else window.localStorage.removeItem(k);
    }, [selectedStudyId, user?.email]);

    useEffect(() => {
        if (!user?.email) return;
        window.localStorage.setItem(keyForUser(user.email, "timer_seconds"), String(timerSeconds));
    }, [timerSeconds, user?.email]);

    useEffect(() => {
        if (!user?.email) return;
        window.localStorage.setItem(keyForUser(user.email, "timer_status"), timerStatus);
    }, [timerStatus, user?.email]);

    useEffect(() => {
        if (!user?.email) return;
        const k = keyForUser(user.email, "pending_session");
        if (pendingSession) window.localStorage.setItem(k, JSON.stringify(pendingSession));
        else window.localStorage.removeItem(k);
    }, [pendingSession, user?.email]);

    // Timer tick
    useEffect(() => {
        if (timerStatus !== "running") return;
        const id = window.setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
        return () => window.clearInterval(id);
    }, [timerStatus]);

    // Auto pause
    useEffect(() => {
        if (!settings.autoPauseEnabled) return;
        if (timerStatus !== "running") return;

        const limitSeconds = settings.autoPauseHours * 3600;

        if (timerSeconds >= limitSeconds) {
            setTimerStatus("paused");

            if (
                settings.notificationsEnabled &&
                "Notification" in window &&
                Notification.permission === "granted"
            ) {
                new Notification("StudyWiz", { body: `Auto paused after ${settings.autoPauseHours} hours.` });
            }
        }
    }, [
        timerSeconds,
        timerStatus,
        settings.autoPauseEnabled,
        settings.autoPauseHours,
        settings.notificationsEnabled,
    ]);

    const setLang = (newLang: Lang) => setLangState(newLang);

    const setTheme = (theme: ThemeMode) => setSettings((p) => ({ ...p, theme }));
    const setNotificationsEnabled = (enabled: boolean) => setSettings((p) => ({ ...p, notificationsEnabled: enabled }));
    const setAutoPauseEnabled = (enabled: boolean) => setSettings((p) => ({ ...p, autoPauseEnabled: enabled }));

    // name + email binding, email unique, name must match previous email
    const login = (payload: { name: string; email: string }) => {
        const rawName = String(payload?.name || "").trim();
        const rawEmail = String(payload?.email || "").trim();

        const cleanName = normalize(rawName);
        const cleanEmail = normalize(rawEmail);

        if (!cleanName || !cleanEmail) {
            return { ok: false, message: "Name and email are required." };
        }

        const reg = loadUserRegistry();
        const existing = reg[cleanEmail];

        if (existing) {
            if (normalize(existing.name) !== cleanName) {
                return { ok: false, message: "Name does not match the email used previously." };
            }
        } else {
            reg[cleanEmail] = { name: rawName, email: cleanEmail, createdAt: Date.now() };
            saveUserRegistry(reg);
        }

        const nextUser = { name: rawName, email: cleanEmail };
        setUser(nextUser);
        window.localStorage.setItem("studywiz_user", JSON.stringify(nextUser));

        return { ok: true, message: "Logged in." };
    };

    const logout = () => {
        // remove user session
        setUser(null);
        window.localStorage.removeItem("studywiz_user");

        // UI goes back to default state instantly
        setCurrentSelection(EMPTY_SELECTION);
        setSavedStudies([]);
        setSelectedStudyId(null);
        setTimerStatus("idle");
        setTimerSeconds(0);
        setPendingSession(null);

        // Keep global settings + language
    };

    const saveSelection = () => {
        if (!user) return {
            ok: false, message: "Login required."

        };

        // Required selections
        if (!currentSelection.timeFrame) return { ok: false, message: "Pick a Study Time Frame." };
        if (!currentSelection.topicMode) return { ok: false, message: "Choose Single or Multiple topics." };

        if (currentSelection.topicMode === "Multiple" && (!currentSelection.topicCount || currentSelection.topicCount < 2)) {
            return { ok: false, message: "Enter a valid number for Multiple topics (2 or more)." };
        }

        if (!currentSelection.priority) return { ok: false, message: "Pick a Priority Level." };

        // Save an actual record
        const id = makeId();
        const createdAt = Date.now();
        const summary = buildSummary(currentSelection);

        const saved: SavedStudy = {
            id,
            createdAt,
            selection: currentSelection,
            summary,
            durationSeconds: 0,
            endedAt: 0,
        };

        setSavedStudies((prev) => [saved, ...prev]);
        setSelectedStudyId(id);

        return { ok: true, message: "Saved.", savedId: id };
    };

    const resetSelection = () => {
        setCurrentSelection(EMPTY_SELECTION);
        setSelectedStudyId(null);
    };

    const selectSavedStudy = (id: string) => {
        const found = savedStudies.find((s) => s.id === id);
        if (!found) return;
        setSelectedStudyId(id);
    };

    const removeSavedStudy = (id: string) => {
        setSavedStudies((prev) => prev.filter((s) => s.id !== id));
        setSelectedStudyId((prev) => (prev === id ? null : prev));
    };

    const studyAgain = (id: string) => {
        const found = savedStudies.find((s) => s.id === id);
        if (!found) return { ok: false, message: "Study not found." };

        setCurrentSelection(found.selection);
        setSelectedStudyId(id);

        return { ok: true, message: "Selection loaded. You can start studying now." };
    };

    const startTimer = () => {
        if (!user) return { ok: false, message: "Login required." };
        if (pendingSession) return { ok: false, message: "Save or delete the last session first." };

        // If starting fresh, reset seconds
        setTimerSeconds((prev) => (timerStatus === "idle" || timerStatus === "stopped" ? 0 : prev));
        setTimerStatus("running");
        return { ok: true };
    };

    const pauseTimer = () => {
        if (timerStatus === "running") setTimerStatus("paused");
    };

    const stopTimer = () => {
        if (timerStatus === "running" || timerStatus === "paused") {
            const endedAt = Date.now();
            const durationSeconds = timerSeconds;

            setTimerStatus("stopped");
            setTimerSeconds(0);

            // Create a pending session based on current selection
            setPendingSession({ durationSeconds, endedAt, selection: currentSelection });
        }
    };

    const resetTimer = () => {
        setTimerStatus("idle");
        setTimerSeconds(0);
        setPendingSession(null);
    };

    const savePendingSession = () => {
        if (!user) return { ok: false, message: "Login required." };
        if (!pendingSession) return { ok: false, message: "No session to save." };

        // If session is too short, discard it (prevents “accidental taps”)
        if (pendingSession.durationSeconds < 5) {
            setPendingSession(null);
            return { ok: false, message: "Session was too short, it was discarded." };
        }

        // If a study is selected, update it with duration, else create a new saved record
        const updateId = selectedStudyId;
        const summary = buildSummary(pendingSession.selection);

        if (updateId && savedStudies.some((s) => s.id === updateId)) {
            setSavedStudies((prev) =>
                prev.map((s) =>
                    s.id === updateId
                        ? {
                            ...s,
                            // Keep the saved plan summary if it exists, but prefer real selection summary
                            summary: s.summary?.trim() ? s.summary : summary,
                            selection: pendingSession.selection,
                            durationSeconds: pendingSession.durationSeconds,
                            endedAt: pendingSession.endedAt,
                        }
                        : s
                )
            );

            setPendingSession(null);
            return { ok: true, message: "Session saved.", savedId: updateId };
        }

        const id = makeId();

        const saved: SavedStudy = {
            id,
            createdAt: pendingSession.endedAt,
            selection: pendingSession.selection,
            summary,
            durationSeconds: pendingSession.durationSeconds,
            endedAt: pendingSession.endedAt,
        };

        setSavedStudies((prev) => [saved, ...prev]);
        setSelectedStudyId(id);
        setPendingSession(null);

        // Optional notification
        if (settings.notificationsEnabled && "Notification" in window) {
            if (Notification.permission === "granted") {
                new Notification("StudyWiz", { body: "Session saved successfully." });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then((p) => {
                    if (p === "granted") new Notification("StudyWiz", { body: "Session saved successfully." });
                });
            }
        }

        return { ok: true, message: "Session saved.", savedId: id };
    };

    const discardPendingSession = () => {
        setPendingSession(null);
    };

    const totalSecondsThisWeek = useMemo(() => {
        const weekStart = startOfWeekMs(new Date());

        return savedStudies
            .filter((s) => (s.endedAt || s.createdAt) >= weekStart)
            .reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    }, [savedStudies]);

    const value = useMemo<AppContextValue>(
        () => ({
            lang,
            setLang,
            user,
            login,
            logout,

            currentSelection,
            setCurrentSelection,

            savedStudies,
            saveSelection,
            resetSelection,

            selectedStudyId,
            selectSavedStudy,

            removeSavedStudy,
            studyAgain,

            timerStatus,
            timerSeconds,
            startTimer,
            pauseTimer,
            stopTimer,
            resetTimer,

            pendingSession,
            savePendingSession,
            discardPendingSession,

            totalSecondsThisWeek,

            settings,
            setTheme,
            setNotificationsEnabled,
            setAutoPauseEnabled,
        }),
        [
            lang,
            user,
            currentSelection,
            savedStudies,
            selectedStudyId,
            timerStatus,
            timerSeconds,
            pendingSession,
            totalSecondsThisWeek,
            settings,
        ]
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used inside AppProvider");
    return ctx;
}
