"use client";

import { useMemo } from "react";
import { useApp } from "@/components/AppProvider";
import { saveSession } from "@/lib/studySessionsStore";

function fmtHM(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const hh = String(hours).padStart(2, "0");
    const mm = String(mins).padStart(2, "0");
    return `${hh}hr ${mm}min`;
}

export default function BottomSummaryBar() {
    const { user, pendingSession, savePendingSession, discardPendingSession, totalSecondsThisWeek, savedStudies } = useApp();

    const completedTopics = useMemo(() => {
        // Only count real saved sessions (not planner saves)
        return savedStudies.filter((s) => (s.durationSeconds || 0) > 0).length;
    }, [savedStudies]);

    const showSessionActions = !!pendingSession;

    return (
        <section className="bottom-summary">
            <div className="bottom-summary-right">
                <strong>Total hours studied this week:</strong> {fmtHM(totalSecondsThisWeek)}
            </div>

            <div className="bottom-summary-center">
                <strong className="bottom-summary-poptext">
                    You have completed studying {completedTopics} {completedTopics === 1 ? "topic" : "topics"}.
                </strong>

                {showSessionActions && <span> Do you want to save this session?</span>}
            </div>

            {showSessionActions && (
                <div className="bottom-summary-buttons">
                    <button
                        className="bottom-yes-button"
                        type="button"
                        onClick={() => {
                            // keep a snapshot before savePendingSession clears it
                            const snap = pendingSession;

                            const res = savePendingSession();
                            if (!res.ok) {
                                alert(res.message);
                                return;
                            }

                            // analytics store is user scoped, so only save if logged in
                            if (user?.email && snap) {
                                saveSession(user.email, snap.durationSeconds, snap.endedAt);
                            }
                        }}
                    >
                        Yes
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            // No = dont save, just discard the pending session
                            discardPendingSession();
                        }}
                    >
                        No
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            // Delete = same behavior for now (discard)
                            discardPendingSession();
                        }}
                    >
                        Delete
                    </button>
                </div>
            )}
        </section>
    );
}
