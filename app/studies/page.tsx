"use client";

import React, { useMemo } from "react";
import { useApp } from "@/components/AppProvider";

function formatDuration(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${String(s).padStart(2, "0")}s`;
}

function formatDate(ms?: number) {
    if (!ms) return "";
    try {
        return new Date(ms).toLocaleString();
    } catch {
        return "";
    }
}

export default function StudiesPage() {
    const { user, savedStudies, selectedStudyId, selectSavedStudy, removeSavedStudy, studyAgain } = useApp();

    // Studies page should only list real saved sessions (timer ran + user clicked Yes to save)
    const completedStudies = useMemo(() => {
        return savedStudies.filter((s) => (s.durationSeconds || 0) > 0 && (s.endedAt || 0) > 0);
    }, [savedStudies]);

    if (!user) {
        return (
            <div className="studies-page">
                <h1 className="studies-title">Studies</h1>
                <div className="studies-empty">Login to view your saved study sessions.</div>
            </div>
        );
    }

    return (
        <div className="studies-page">
            <h1 className="studies-title">Studies</h1>
            <p className="studies-subtitle">This page lists your saved study sessions.</p>

            {completedStudies.length === 0 ? (
                <div className="studies-empty">
                    No saved sessions yet. Run a session in the Timer Panel and click Yes to save, then it will show here.
                </div>
            ) : (
                <div className="studies-list">
                    {completedStudies.map((s) => {
                        const isSelected = s.id === selectedStudyId;

                        return (
                            <div
                                key={s.id}
                                className={`study-card ${isSelected ? "is-selected" : ""}`}
                                onClick={() => selectSavedStudy(s.id)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="study-card-top">
                                    <div className="study-card-summary">{s.summary}</div>

                                    {/* stopPropagation keeps button clicks from also selecting the card twice */}
                                    <div className="study-card-actions" onClick={(e) => e.stopPropagation()}>
                                        <button type="button" className="study-btn primary" onClick={() => studyAgain(s.id)}>
                                            Study Again
                                        </button>

                                        <button type="button" className="study-btn danger" onClick={() => removeSavedStudy(s.id)}>
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                <div className="study-card-meta">
                                    <span>Duration: {formatDuration(s.durationSeconds || 0)}</span>
                                    <span className="dot">•</span>
                                    <span>Saved: {formatDate(s.endedAt || s.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
