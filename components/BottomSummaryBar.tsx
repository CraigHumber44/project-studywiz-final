"use client";

import { useEffect, useState } from "react";

export default function BottomSummaryBar() {
    const [completedTopics, setCompletedTopics] = useState(0);
    const [showSessionActions, setShowSessionActions] = useState(false);

    useEffect(() => {
        function handleSessionStopped() {
            setCompletedTopics(prev => prev + 1);
            setShowSessionActions(true);
        }

        window.addEventListener("studySessionStopped", handleSessionStopped);
        return () => {
            window.removeEventListener("studySessionStopped", handleSessionStopped);
        };
    }, []);

    function handleDelete() {
        setCompletedTopics(0);
        setShowSessionActions(false);
    }

    return (
        <section className="bottom-summary">

            {/* LEFT (total hours display) */}
            <div className="bottom-summary-right">
                <strong>Total hours studied this week:</strong> 00hr 00min
            </div>

            {/* CENTER */}
            <div className="bottom-summary-center">
                <strong className="bottom-summary-poptext">
                    You have completed studying {completedTopics}{" "}
                    {completedTopics === 1 ? "topic" : "topics"}.
                </strong>

                {showSessionActions && (
                    <span> Do you want to save this session?</span>
                )}
            </div>

            {/* RIGHT (action buttons) */}
            {showSessionActions && (
                <div className="bottom-summary-buttons">
                    <button>Yes</button>
                    <button>No</button>
                    <button onClick={handleDelete}>Delete</button>
                </div>
            )}
        </section>
    );
}
