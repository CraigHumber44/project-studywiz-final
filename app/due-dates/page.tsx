"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";

type SubmissionType = "Test" | "Exam" | "Lab" | "Assignment" | "Project" | "Other";

type DueDateRow = {
    studyId: string;
    submissionType: SubmissionType;
    dueDate: string; // yyyy-mm-dd
    notify: boolean;
    updatedAt: number;
};

function formatDateTime(ms?: number) {
    if (!ms) return "";
    try {
        return new Date(ms).toLocaleString();
    } catch {
        return "";
    }
}

function safeUserKey(email: string) {
    return email.trim().toLowerCase();
}

function dueKeyForUser(email: string) {
    return `studywiz_due_dates_v1__${safeUserKey(email)}`;
}

export default function DueDatesPage() {
    const { user, savedStudies } = useApp();

    const [dueRows, setDueRows] = useState<Record<string, DueDateRow>>({});
    const [q, setQ] = useState("");

    // Controls the popup
    const [openStudyId, setOpenStudyId] = useState<string | null>(null);

    // Load due dates (user scoped)
    useEffect(() => {
        if (!user?.email) {
            setDueRows({});
            setOpenStudyId(null);
            return;
        }

        const raw = window.localStorage.getItem(dueKeyForUser(user.email));
        const list: DueDateRow[] = raw ? JSON.parse(raw) : [];
        const map: Record<string, DueDateRow> = {};
        for (const row of Array.isArray(list) ? list : []) map[row.studyId] = row;
        setDueRows(map);
    }, [user?.email]);

    function persist(nextMap: Record<string, DueDateRow>) {
        setDueRows(nextMap);

        // Guest should never write private data
        if (!user?.email) return;

        const list = Object.values(nextMap).sort((a, b) => b.updatedAt - a.updatedAt);
        window.localStorage.setItem(dueKeyForUser(user.email), JSON.stringify(list));
    }

    function updateRow(studyId: string, patch: Partial<DueDateRow>) {
        const prev = dueRows[studyId];

        const next: DueDateRow = {
            studyId,
            submissionType: prev?.submissionType ?? "Assignment",
            dueDate: prev?.dueDate ?? "",
            notify: prev?.notify ?? false,
            ...patch,
            updatedAt: Date.now(),
        };

        persist({ ...dueRows, [studyId]: next });
    }

    function clearRow(studyId: string) {
        const ok = window.confirm("Clear due date info for this study?");
        if (!ok) return;

        const next = { ...dueRows };
        delete next[studyId];
        persist(next);

        if (openStudyId === studyId) setOpenStudyId(null);
    }

    // nothing should show here until a timer session was saved
    const completedStudies = useMemo(() => {
        return savedStudies.filter((s) => (s.durationSeconds || 0) > 0 && (s.endedAt || 0) > 0);
    }, [savedStudies]);

    const filteredStudies = useMemo(() => {
        const text = q.trim().toLowerCase();
        if (!text) return completedStudies;

        return completedStudies.filter((s) => {
            const title = (s.summary || "").toLowerCase();
            const topics = (s.selection?.topicsText || "").toLowerCase();
            const courses = (s.selection?.coursesText || "").toLowerCase();
            return title.includes(text) || topics.includes(text) || courses.includes(text);
        });
    }, [q, completedStudies]);

    const openStudy = useMemo(() => {
        if (!openStudyId) return null;

        // popup should also respect the same rule
        return completedStudies.find((x) => x.id === openStudyId) ?? null;
    }, [openStudyId, completedStudies]);

    const openRow = openStudyId ? dueRows[openStudyId] : undefined;

    if (!user) {
        return (
            <div className="due-page">
                <h1 className="due-title">Set Due Dates</h1>
                <div className="due-empty">Login to manage due dates for your saved studies.</div>
            </div>
        );
    }

    return (
        <div className="due-page">
            <h1 className="due-title">Set Due Dates</h1>
            <p className="due-subtitle">
                Only study sessions that were run and saved will display here. A submission type and due date for each saved session. You
                can also choose whether to enable reminders.
            </p>

            <div className="due-toolbar">
                <input
                    className="due-search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search your saved studies..."
                />
            </div>

            {filteredStudies.length === 0 ? (
                <div className="due-empty">
                    No saved study sessions yet. Run a session in the Timer Panel and click Yes to save, then come back here.
                </div>
            ) : (
                <div className="due-list">
                    {filteredStudies.map((s) => {
                        const title = s.summary || "Saved Study";
                        const row = dueRows[s.id];

                        return (
                            <div key={s.id} className="due-card">
                                <div className="due-card-left">
                                    <div className="due-card-title">{title}</div>

                                    <div className="due-card-meta">
                                        {s.selection?.priority ? <span>Priority: {String(s.selection.priority)}</span> : null}
                                        {s.endedAt ? <span className="dot"> • </span> : null}
                                        {s.endedAt ? <span>Saved: {formatDateTime(s.endedAt)}</span> : null}

                                        {row?.dueDate ? <span className="dot"> • </span> : null}
                                        {row?.dueDate ? <span>Due: {row.dueDate}</span> : null}
                                        {row?.submissionType ? <span className="dot"> • </span> : null}
                                        {row?.submissionType ? <span>Type: {row.submissionType}</span> : null}
                                        {row ? <span className="dot"> • </span> : null}
                                        {row ? <span>Notify: {row.notify ? "Yes" : "No"}</span> : null}
                                    </div>

                                    {s.selection?.topicsText?.trim() ? (
                                        <div className="due-card-topics">Topics: {s.selection.topicsText}</div>
                                    ) : null}
                                </div>

                                <div className="due-card-actions">
                                    <button className="due-options-btn" type="button" onClick={() => setOpenStudyId(s.id)}>
                                        Options
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* OPTIONS POPUP */}
            {openStudyId && openStudy ? (
                <div className="due-modal-backdrop" onClick={() => setOpenStudyId(null)} role="dialog" aria-modal="true">
                    <div className="due-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="due-modal-header">
                            <div className="due-modal-title">Due date settings</div>
                            <button className="due-modal-close" type="button" onClick={() => setOpenStudyId(null)}>
                                Close
                            </button>
                        </div>

                        <div className="due-card-title" style={{ marginBottom: 10 }}>
                            {openStudy.summary || "Saved Study"}
                        </div>

                        <div className="due-field">
                            <label className="due-label">Submission type</label>
                            <select
                                className="due-select"
                                value={openRow?.submissionType ?? "Assignment"}
                                onChange={(e) => updateRow(openStudyId, { submissionType: e.target.value as SubmissionType })}
                            >
                                <option>Test</option>
                                <option>Exam</option>
                                <option>Lab</option>
                                <option>Assignment</option>
                                <option>Project</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div className="due-field">
                            <label className="due-label">Due date</label>
                            <input
                                className="due-date"
                                type="date"
                                value={openRow?.dueDate ?? ""}
                                onChange={(e) => updateRow(openStudyId, { dueDate: e.target.value })}
                            />
                        </div>

                        <div className="due-field">
                            <label className="due-label">Set notification?</label>
                            <div className="due-toggle">
                                <button
                                    type="button"
                                    className={`due-pill ${openRow?.notify ? "is-active" : ""}`}
                                    onClick={() => updateRow(openStudyId, { notify: true })}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    className={`due-pill ${openRow?.notify === false ? "is-active" : ""}`}
                                    onClick={() => updateRow(openStudyId, { notify: false })}
                                >
                                    No
                                </button>
                            </div>
                        </div>

                        <div className="due-actions">
                            <button className="due-btn danger" onClick={() => clearRow(openStudyId)} type="button">
                                Clear
                            </button>
                        </div>

                        {openRow?.updatedAt ? (
                            <div className="due-updated">Updated: {formatDateTime(openRow.updatedAt)}</div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
