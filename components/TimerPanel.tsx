"use client";

import { useEffect, useState } from "react";

type TimerStatus = "idle" | "running" | "paused" | "stopped";

export default function TimerPanel() {
    const [seconds, setSeconds] = useState(0);
    const [status, setStatus] = useState<TimerStatus>("idle");


    // tick every second when running
    useEffect(() => {
        if (status !== "running") return;

        const id = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(id);
    }, [status]);

    const timeString = new Date(seconds * 1000)
        .toISOString()
        .substring(14, 19); // "mm:ss"

    function handleStart() {
        // reset to zero when starting from idle or stopped
        setSeconds((prev) =>
            status === "idle" || status === "stopped" ? 0 : prev
        );
        setStatus("running");
    }

    function handlePause() {
        if (status === "running") setStatus("paused");
    }

    function handleStop() {
        if (status === "running" || status === "paused") {
            setStatus("stopped");
            setSeconds(0);

            // tell the bottom bar that a study session finished
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("studySessionStopped"));
            }
        }
    }

    function handleReset() {
        setStatus("idle");
        setSeconds(0);
    }

    function statusMessage() {
        if (status === "running") return "Study session in progress";
        if (status === "paused") return "Study session paused";
        if (status === "stopped") return "Study session stopped";
        return "No study is currently running";
    }

    // choose icon for current status
    let indicator = null;
    if (status === "running") {
        indicator = (
            <div className="timer-indicator running">
                ▶
            </div>
        );
    } else if (status === "paused") {
        indicator = (
            <div className="timer-indicator paused">
                ❚❚
            </div>
        );
    } else if (status === "stopped") {
        indicator = (
            <div className="timer-indicator stopped">
                ■
            </div>
        );
    }

    return (
        <section className="study-main">
            <h2 className="study-title">READY TO BEGIN STUDY?</h2>
            <p className="study-subtitle">
                Choose your options. You can pause if you decide to take a break in
                between studies and continue at anytime. Have a good time studying!
            </p>

            <div className="study-layout">
                {/* left buttons */}
                <div className="timer-buttons-column">
                    <button className="timer-btn" onClick={handleStart}>
                        START
                    </button>
                    <button className="timer-btn" onClick={handleStop}>
                        STOP
                    </button>
                </div>

                {/* timer circle */}
                <div className="timer-center">
                    <div className="timer-circle">
                        {indicator}

                        <div className="timer-time">{timeString}</div>
                        <div className="timer-label">Elapsed Time</div>
                    </div>

                    <div className="timer-status">{statusMessage()}</div>
                </div>

                {/* right buttons */}
                <div className="timer-buttons-column">
                    <button className="timer-btn" onClick={handlePause}>
                        PAUSE
                    </button>
                    <button className="timer-btn" onClick={handleReset}>
                        RESET
                    </button>
                </div>
            </div>
        </section>
    );
}
