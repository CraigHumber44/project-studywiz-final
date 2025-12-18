"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import {
    loadSessions,
    sessionMinutes,
    sessionTimestamp,
    type StudySession,
    SESSIONS_UPDATED_EVENT,
} from "@/lib/studySessionsStore";

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function minutesToHrMin(totalMinutes: number) {
    const m = Math.max(0, Math.floor(totalMinutes));
    const hr = Math.floor(m / 60);
    const min = m % 60;
    return `${pad2(hr)}hr ${pad2(min)}min`;
}

function minutesToShortLabel(mins: number) {
    const m = Math.max(0, Math.floor(mins));
    if (m < 60) return `${m} min`;
    const hr = Math.floor(m / 60);
    const rem = m % 60;
    return rem === 0 ? `${hr} hr` : `${hr} hr ${rem} min`;
}

function formatDuration(totalSeconds: number) {
    const sec = Math.max(0, Math.floor(totalSeconds || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${String(s).padStart(2, "0")}s`;
}

function formatDateTime(ms?: number) {
    if (!ms) return "";
    try {
        return new Date(ms).toLocaleString();
    } catch {
        return "";
    }
}

type FrameRow = {
    key: string;
    label: string;
    minutes: number;
    percent: number;
};

function StudyBarChart({
    rows,
    animateNonce,
}: {
    rows: FrameRow[];
    animateNonce: number;
}) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setReady(false);
        const id = window.requestAnimationFrame(() => setReady(true));
        return () => window.cancelAnimationFrame(id);
    }, [animateNonce, rows.length]);

    return (
        <div className={`overview-bars ${ready ? "is-ready" : ""}`} role="img" aria-label="Study breakdown chart">
            {rows.map((r, i) => {
                const hasData = r.minutes > 0;
                const safePct = Number.isFinite(r.percent) ? r.percent : 0;
                const clampedPct = Math.max(0, Math.min(100, safePct));

                return (
                    <div key={r.key} className="overview-bar-row">
                        <div className="overview-bar-label">{r.label}</div>

                        <div className={`overview-bar-track ${hasData ? "has-data" : "is-empty"}`}>
                            <div
                                className="overview-bar-fill"
                                style={{
                                    ["--final-width" as any]: `${clampedPct}%`,
                                    ["--delay" as any]: `${i * 90}ms`,
                                }}
                            />
                        </div>

                        <div className="overview-bar-meta">
                            <span className={`pct ${hasData ? "" : "muted"}`}>{Math.round(clampedPct)}%</span>
                            <span className="dot"> • </span>
                            <span className={hasData ? "" : "muted"}>{minutesToShortLabel(r.minutes)}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function pickSavedStudyTimestamp(s: any) {
    const t =
        (typeof s?.savedAt === "number" && s.savedAt) ||
        (typeof s?.endedAt === "number" && s.endedAt) ||
        (typeof s?.createdAt === "number" && s.createdAt) ||
        0;
    return t;
}

function buildSavedStudyTitle(s: any) {
    const summary = typeof s?.summary === "string" ? s.summary.trim() : "";
    if (summary) return summary;

    const parts: string[] = [];

    const timeframe =
        (typeof s?.timeframe === "string" && s.timeframe.trim()) ||
        (typeof s?.durationLabel === "string" && s.durationLabel.trim()) ||
        (typeof s?.duration === "string" && s.duration.trim()) ||
        "";
    if (timeframe) parts.push(timeframe);

    const mode =
        (typeof s?.studyMode === "string" && s.studyMode.trim()) ||
        (typeof s?.mode === "string" && s.mode.trim()) ||
        "";
    if (mode) parts.push(mode);

    const pr = s?.priority;
    if (pr !== undefined && pr !== null && String(pr).trim() !== "") parts.push(`Priority ${String(pr).trim()}`);

    const topics = Array.isArray(s?.topics) ? s.topics.filter(Boolean) : [];
    if (topics.length) parts.push(`Topics: ${topics.slice(0, 3).join(", ")}`);

    if (parts.length) return parts.join(" | ");

    return "Untitled study";
}

// minutes fallback so bars are not always 0
function minutesFromSessionSafe(s: StudySession): number {
    const m1 = Number(sessionMinutes(s));
    if (Number.isFinite(m1) && m1 > 0) return Math.floor(m1);

    const ds = (s as any)?.durationSeconds;
    if (typeof ds === "number" && Number.isFinite(ds) && ds > 0) {
        return Math.max(1, Math.round(ds / 60));
    }

    const started = (s as any)?.startedAt;
    const ended = (s as any)?.endedAt ?? (s as any)?.savedAt;
    if (typeof started === "number" && typeof ended === "number" && ended > started) {
        return Math.max(1, Math.round((ended - started) / 60000));
    }

    return 0;
}

export default function OverviewPage() {
    const { user, savedStudies } = useApp();

    const [sessions, setSessions] = useState<StudySession[]>([]);
    const [animateNonce, setAnimateNonce] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function read() {
            const email = user?.email;
            if (!email) {
                if (!cancelled) setSessions([]);
                return;
            }

            try {
                const list = await loadSessions(email);
                if (!cancelled) setSessions(Array.isArray(list) ? list : []);
            } catch {
                if (!cancelled) setSessions([]);
            }
        }

        read();

        function onUpdate() {
            read();
        }

        window.addEventListener(SESSIONS_UPDATED_EVENT, onUpdate);
        window.addEventListener("storage", onUpdate);

        return () => {
            cancelled = true;
            window.removeEventListener(SESSIONS_UPDATED_EVENT, onUpdate);
            window.removeEventListener("storage", onUpdate);
        };
    }, [user?.email]);

    useEffect(() => {
        const sig = sessions
            .map((s) => `${sessionTimestamp(s)}:${minutesFromSessionSafe(s)}`)
            .join("|");
        setAnimateNonce((n) => n + 1);
        void sig;
    }, [sessions]);

    const stats = useMemo(() => {
        const now = Date.now();
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

        let weekMinutes = 0;
        let allTimeMinutes = 0;

        for (const s of sessions) {
            const mins = minutesFromSessionSafe(s);
            allTimeMinutes += mins;

            const ts = sessionTimestamp(s);
            if (ts >= weekAgo) weekMinutes += mins;
        }

        return {
            weekMinutes,
            allTimeMinutes,
            savedSessions: sessions.length,
        };
    }, [sessions]);

    const chartRows = useMemo<FrameRow[]>(() => {
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;

        const t24h = now - 1 * day;
        const t7 = now - 7 * day;
        const t30 = now - 30 * day;
        const t90 = now - 90 * day;

        let last24h = 0;
        let last7 = 0;
        let days8to30 = 0;
        let days31to90 = 0;
        let older = 0;

        for (const s of sessions) {
            const mins = minutesFromSessionSafe(s);
            const ts = sessionTimestamp(s);

            if (ts >= t24h) last24h += mins;

            if (ts >= t7) last7 += mins;
            else if (ts >= t30) days8to30 += mins;
            else if (ts >= t90) days31to90 += mins;
            else older += mins;
        }

        const all = last7 + days8to30 + days31to90 + older;
        const pct = (mins: number) => (all > 0 ? (mins / all) * 100 : 0);

        return [
            { key: "24h", label: "Last 24 hours", minutes: last24h, percent: pct(last24h) },
            { key: "7d", label: "Last 7 days", minutes: last7, percent: pct(last7) },
            { key: "8-30", label: "Days 8 to 30", minutes: days8to30, percent: pct(days8to30) },
            { key: "31-90", label: "Days 31 to 90", minutes: days31to90, percent: pct(days31to90) },
            { key: "old", label: "Older than 90", minutes: older, percent: pct(older) },
        ];
    }, [sessions]);

    const lastSavedStudy = useMemo(() => {
        if (!savedStudies || savedStudies.length === 0) return null;

        const copy = [...savedStudies];
        copy.sort((a: any, b: any) => pickSavedStudyTimestamp(b) - pickSavedStudyTimestamp(a));
        return copy[0] as any;
    }, [savedStudies]);

    const overlayTitle = useMemo(() => {
        if (!lastSavedStudy) return "";
        return buildSavedStudyTitle(lastSavedStudy);
    }, [lastSavedStudy]);

    const overlayDuration = useMemo(() => {
        if (!lastSavedStudy) return "";
        return formatDuration((lastSavedStudy as any).durationSeconds || 0);
    }, [lastSavedStudy]);

    const overlaySaved = useMemo(() => {
        if (!lastSavedStudy) return "";
        const ts = pickSavedStudyTimestamp(lastSavedStudy);
        return formatDateTime(ts);
    }, [lastSavedStudy]);

    return (
        <div className="overview-page">
            <h1 className="overview-title">Overview</h1>

            <div className="overview-grid">
                <div className="overview-left">
                    <div className="overview-card">
                        <div className="overview-card-row">
                            <span className="overview-label">This week:</span>
                            <span>{minutesToHrMin(stats.weekMinutes)}</span>
                        </div>
                    </div>

                    <div className="overview-card">
                        <div className="overview-card-row">
                            <span className="overview-label">All time:</span>
                            <span>{minutesToHrMin(stats.allTimeMinutes)}</span>
                        </div>
                    </div>

                    <div className="overview-card">
                        <div className="overview-card-row">
                            <span className="overview-label">Saved sessions:</span>
                            <span>{stats.savedSessions}</span>
                        </div>
                    </div>
                </div>

                <div className="overview-right">
                    <div className="overview-chart-card">
                        <div className="overview-chart-title">Study Breakdown</div>

                        <div className="overview-chart-wrap">
                            <StudyBarChart rows={chartRows} animateNonce={animateNonce} />
                        </div>

                        <div className="overview-last-panel">
                            <div className="overview-last-head">
                                <div className="overview-last-title">
                                    Last Study Activity
                                    <span className="overview-chart-subtitle">Recent session</span>
                                </div>
                            </div>

                            {!lastSavedStudy ? (
                                <div className="overview-empty">No recent study sessions yet.</div>
                            ) : (
                                <div className="overview-activity-list">
                                    <div className="overview-activity-row overview-activity-row--wide">
                                        <div className="overview-activity-main">
                                            <div className="overview-activity-title">{overlayTitle}</div>

                                            <div className="overview-activity-time">
                                                Duration: {overlayDuration}
                                                <span className="dot"> • </span>
                                                Saved: {overlaySaved}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
