"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";

type TimeFrame = "1 Day" | "1 Week" | "1 Month" | null;
type TopicMode = "Single" | "Multiple" | null;
type Priority = "Priority 1" | "Priority 2" | "Priority 3" | null;

type GuestSelection = {
    timeFrame: TimeFrame;
    startDate: string;
    endDate: string;
    topicMode: TopicMode;
    topicCount: number | null;
    topicsText: string;
    coursesText: string;
    priority: Priority;
};

type GuestSavedStudy = {
    id: string;
    summary: string;
    selection: GuestSelection;
    savedAt: number;
};

const GUEST_SAVED_KEY = "studywiz_guest_saved_studies_v1";

function makeId() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function asTimeFrame(v: any): TimeFrame {
    if (v === "1 Day" || v === "1 Week" || v === "1 Month") return v;
    return null;
}

function asTopicMode(v: any): TopicMode {
    if (v === "Single" || v === "Multiple") return v;
    return null;
}

function asPriority(v: any): Priority {
    if (v === "Priority 1" || v === "Priority 2" || v === "Priority 3") return v;
    return null;
}

export default function StudyControlsBar() {
    const router = useRouter();

    const {
        user,
        currentSelection,
        setCurrentSelection,
        savedStudies,
        saveSelection,
        resetSelection,
        selectSavedStudy,
    } = useApp();

    const [toastMsg, setToastMsg] = useState("");
    const [search, setSearch] = useState("");
    const [activeAction, setActiveAction] = useState<"save" | "reset" | null>(null);

    const [guestSaved, setGuestSaved] = useState<GuestSavedStudy[]>([]);

    useEffect(() => {
        if (user) return;
        const list = safeParse<GuestSavedStudy[]>(window.localStorage.getItem(GUEST_SAVED_KEY), []);
        setGuestSaved(Array.isArray(list) ? list : []);
    }, [user]);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        window.clearTimeout((showToast as any)._t);
        (showToast as any)._t = window.setTimeout(() => setToastMsg(""), 2200);
    };

    const selectionSummary = useMemo(() => {
        const tf = currentSelection.timeFrame ?? "No time frame";
        const pr = currentSelection.priority ?? "No priority";
        const mode =
            currentSelection.topicMode === "Single"
                ? "Single"
                : currentSelection.topicMode === "Multiple"
                    ? `Multiple (${currentSelection.topicCount ?? "?"})`
                    : "No mode";

        const datePart =
            currentSelection.startDate || currentSelection.endDate
                ? `${currentSelection.startDate || "?"} to ${currentSelection.endDate || "?"}`
                : "No dates";

        return `${tf} | ${datePart} | ${mode} | ${pr}`;
    }, [currentSelection]);

    const hasAnyInput =
        !!currentSelection.timeFrame ||
        !!currentSelection.startDate ||
        !!currentSelection.endDate ||
        !!currentSelection.topicMode ||
        (currentSelection.topicCount !== null && currentSelection.topicCount !== undefined) ||
        currentSelection.topicsText.trim().length > 0 ||
        currentSelection.coursesText.trim().length > 0 ||
        !!currentSelection.priority;

    const canSave =
        !!currentSelection.timeFrame &&
        !!currentSelection.topicMode &&
        !!currentSelection.priority &&
        (currentSelection.topicMode !== "Multiple" ||
            (currentSelection.topicCount !== null && currentSelection.topicCount >= 2));

    const setActive = (key: string, value: any) => {
        setActiveAction(null);
        setCurrentSelection({ ...currentSelection, [key]: value });
    };

    function buildGuestSummary() {
        const tf = currentSelection.timeFrame ?? "No time frame";
        const mode =
            currentSelection.topicMode === "Single"
                ? "Single"
                : currentSelection.topicMode === "Multiple"
                    ? `Multiple (${currentSelection.topicCount ?? "?"})`
                    : "No mode";

        const pr = currentSelection.priority ?? "No priority";

        const topics = currentSelection.topicsText
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        const topicPart = topics.length ? `Topics: ${topics.slice(0, 3).join(", ")}` : "Topics: none";

        return `${tf} | ${mode} | ${pr} | ${topicPart}`;
    }

    function saveSelectionAsGuest() {
        if (!canSave) {
            showToast("Complete the required selections to save.");
            return { ok: false as const };
        }

        const next: GuestSavedStudy = {
            id: makeId(),
            summary: buildGuestSummary(),
            selection: {
                timeFrame: asTimeFrame(currentSelection.timeFrame),
                startDate: currentSelection.startDate || "",
                endDate: currentSelection.endDate || "",
                topicMode: asTopicMode(currentSelection.topicMode),
                topicCount:
                    currentSelection.topicCount !== null && currentSelection.topicCount !== undefined
                        ? Number(currentSelection.topicCount)
                        : null,
                topicsText: currentSelection.topicsText || "",
                coursesText: currentSelection.coursesText || "",
                priority: asPriority(currentSelection.priority),
            },
            savedAt: Date.now(),
        };

        const updated = [next, ...guestSaved].slice(0, 50);
        setGuestSaved(updated);
        window.localStorage.setItem(GUEST_SAVED_KEY, JSON.stringify(updated));

        setActiveAction("save");
        showToast("Selection saved as Guest. You can start after login.");
        return { ok: true as const };
    }

    const listForSearch = useMemo(() => {
        return user ? (savedStudies as any[]) : (guestSaved as any[]);
    }, [user, savedStudies, guestSaved]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return [];

        return listForSearch
            .filter((s: any) => {
                const summary = typeof s?.summary === "string" ? s.summary : "";
                const topicsText = typeof s?.selection?.topicsText === "string" ? s.selection.topicsText : "";
                const coursesText = typeof s?.selection?.coursesText === "string" ? s.selection.coursesText : "";
                const text = `${summary} ${topicsText} ${coursesText}`.toLowerCase();
                return text.includes(q);
            })
            .slice(0, 6);
    }, [search, listForSearch]);

    function applyGuestSavedStudy(item: GuestSavedStudy) {
        setCurrentSelection({
            ...currentSelection,
            timeFrame: item.selection.timeFrame,
            startDate: item.selection.startDate,
            endDate: item.selection.endDate,
            topicMode: item.selection.topicMode,
            topicCount: item.selection.topicCount,
            topicsText: item.selection.topicsText,
            coursesText: item.selection.coursesText,
            priority: item.selection.priority,
        });

        setSearch("");
        setActiveAction(null);
        router.push(`/studies?selected=${encodeURIComponent(item.id)}`);
    }

    const onPickSaved = (id: string) => {
        if (user) {
            selectSavedStudy(id);
            setSearch("");
            setActiveAction(null);
            router.push(`/studies?selected=${encodeURIComponent(id)}`);
            return;
        }

        const hit = guestSaved.find((x) => x.id === id);
        if (hit) applyGuestSavedStudy(hit);
    };

    const isActive = (val: string, current: any) => val === current;

    return (
        <section className="controls-bar">
            <div className="controls-column controls-search">
                <p className="controls-section-title">User: {user ? user.name : "Guest"}</p>
                <p className="controls-section-title">Selection: {selectionSummary}</p>

                <div className="controls-search-wrap">
                    <input
                        className="study-search-input"
                        placeholder="Search topics/studies here"
                        value={search}
                        onChange={(e) => {
                            setActiveAction(null);
                            setSearch(e.target.value);
                        }}
                    />

                    {filtered.length > 0 && (
                        <div className="controls-search-results" role="listbox" aria-label="Search results">
                            {filtered.map((item: any) => (
                                <button
                                    key={item.id}
                                    className="controls-search-result"
                                    onClick={() => onPickSaved(item.id)}
                                    type="button"
                                >
                                    {item.summary}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="controls-column">
                <h4>Study Time Frame</h4>
                <div className="controls-vertical-buttons">
                    <button
                        className={isActive("1 Day", currentSelection.timeFrame) ? "is-active" : ""}
                        onClick={() => setActive("timeFrame", "1 Day")}
                        type="button"
                    >
                        1 Day
                    </button>
                    <button
                        className={isActive("1 Week", currentSelection.timeFrame) ? "is-active" : ""}
                        onClick={() => setActive("timeFrame", "1 Week")}
                        type="button"
                    >
                        1 Week
                    </button>
                    <button
                        className={isActive("1 Month", currentSelection.timeFrame) ? "is-active" : ""}
                        onClick={() => setActive("timeFrame", "1 Month")}
                        type="button"
                    >
                        1 Month
                    </button>
                </div>
            </div>

            <div className="controls-column">
                <h4>Start and End Date</h4>
                <div className="controls-vertical-buttons">
                    <input
                        className="controls-date-input"
                        type="date"
                        value={currentSelection.startDate}
                        onChange={(e) => setActive("startDate", e.target.value)}
                        aria-label="Start date"
                    />
                    <input
                        className="controls-date-input"
                        type="date"
                        value={currentSelection.endDate}
                        onChange={(e) => setActive("endDate", e.target.value)}
                        aria-label="End date"
                    />
                </div>
            </div>

            <div className="controls-column controls-topics">
                <h4>Topics to Study</h4>

                <div className="controls-topics-row">
                    <div className="controls-vertical-buttons">
                        <button
                            className={isActive("Single", currentSelection.topicMode) ? "is-active" : ""}
                            onClick={() => setActive("topicMode", "Single")}
                            type="button"
                        >
                            Single
                        </button>

                        <button
                            className={isActive("Multiple", currentSelection.topicMode) ? "is-active" : ""}
                            onClick={() => setActive("topicMode", "Multiple")}
                            type="button"
                        >
                            Multiple
                        </button>

                        {currentSelection.topicMode === "Multiple" ? (
                            <input
                                className="controls-number-input"
                                type="number"
                                min={2}
                                placeholder="Enter number"
                                value={currentSelection.topicCount ?? ""}
                                onChange={(e) => setActive("topicCount", Number(e.target.value))}
                                aria-label="Number of topics"
                            />
                        ) : (
                            <button className="is-disabled" type="button" disabled>
                                Enter number
                            </button>
                        )}
                    </div>

                    <div className="controls-topics-boxes">
                        <label className="controls-input-group">
                            <span className="controls-input-label"></span>
                            <textarea
                                className="controls-text-input"
                                placeholder="Topic To Study: Enter the names based on the numbers provided, separated by commas"
                                rows={2}
                                value={currentSelection.topicsText}
                                onChange={(e) => setActive("topicsText", e.target.value)}
                            />
                        </label>

                        <label className="controls-input-group">
                            <span className="controls-input-label"></span>
                            <textarea
                                className="controls-text-input"
                                placeholder="Related Courses: Enter related course names for each topic, in sequence and separated by commas"
                                rows={2}
                                value={currentSelection.coursesText}
                                onChange={(e) => setActive("coursesText", e.target.value)}
                            />
                        </label>
                    </div>
                </div>
            </div>

            <div className="controls-column">
                <h4>Priority Level</h4>
                <div className="controls-vertical-buttons">
                    <button
                        className={isActive("Priority 1", currentSelection.priority) ? "is-active" : ""}
                        onClick={() => setActive("priority", "Priority 1")}
                        type="button"
                    >
                        Priority 1
                    </button>
                    <button
                        className={isActive("Priority 2", currentSelection.priority) ? "is-active" : ""}
                        onClick={() => setActive("priority", "Priority 2")}
                        type="button"
                    >
                        Priority 2
                    </button>
                    <button
                        className={isActive("Priority 3", currentSelection.priority) ? "is-active" : ""}
                        onClick={() => setActive("priority", "Priority 3")}
                        type="button"
                    >
                        Priority 3
                    </button>
                </div>
            </div>

            <div className="controls-column controls-save-reset">
                <button
                    className={`save-btn ${hasAnyInput ? "btn-pop" : "btn-dim"} ${activeAction === "save" ? "btn-active-text" : ""
                        }`}
                    onClick={() => {
                        if (!canSave) {
                            showToast("Complete the required selections to save.");
                            return;
                        }

                        if (!user) {
                            saveSelectionAsGuest();
                            return;
                        }

                        const res = saveSelection();
                        if (!res.ok) {
                            showToast("Complete the required selections to save.");
                            return;
                        }

                        setActiveAction("save");
                        showToast("Selection is saved. You can start study");
                    }}
                    type="button"
                    title={!canSave ? "Complete required selections to save" : "Save selection"}
                >
                    Save
                </button>

                <button
                    className={`reset-btn ${hasAnyInput ? "btn-pop" : "btn-dim"} ${activeAction === "reset" ? "btn-active-text" : ""
                        }`}
                    onClick={() => {
                        if (!hasAnyInput) {
                            showToast("Nothing to reset yet.");
                            return;
                        }

                        resetSelection();
                        setSearch("");
                        setActiveAction("reset");
                        showToast("Selection reset.");
                    }}
                    type="button"
                    title={!hasAnyInput ? "Nothing to reset" : "Reset selection"}
                >
                    Reset
                </button>

                {toastMsg && <div className="controls-toast">{toastMsg}</div>}
            </div>
        </section>
    );
}
