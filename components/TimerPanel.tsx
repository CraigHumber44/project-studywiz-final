"use client";

import React, { useMemo } from "react";
import { useApp } from "@/components/AppProvider";

export default function TimerPanel() {
    const { user, timerSeconds, timerStatus, startTimer, pauseTimer, stopTimer, resetTimer } = useApp();

    const timeString = useMemo(() => {
        return new Date(timerSeconds * 1000).toISOString().substring(14, 19);
    }, [timerSeconds]);

    function handleStart() {
        // If guest, open login modal
        if (!user) {
            window.dispatchEvent(new CustomEvent("openLogin"));
            return;
        }

        const res = startTimer();
        if (!res.ok && res.message) alert(res.message);
    }

    function handleStop() {
        // Stop creates the pending session in AppProvider
        stopTimer();
    }

    function statusMessage() {
        if (timerStatus === "running") return "Study session in progress";
        if (timerStatus === "paused") return "Study session paused";
        if (timerStatus === "stopped") return "Study session stopped";
        return "No study is currently running";
    }

    let indicator: React.ReactNode = null;
    if (timerStatus === "running") indicator = <div className="timer-indicator running">▶</div>;
    if (timerStatus === "paused") indicator = <div className="timer-indicator paused">❚❚</div>;
    if (timerStatus === "stopped") indicator = <div className="timer-indicator stopped">■</div>;

    return (
        <section className="study-main">
            <h2 className="study-title">READY TO BEGIN STUDY?</h2>
            <p className="study-subtitle">
                Choose your options. You can pause if you decide to take a break in between studies and continue at anytime. Have a good time studying!
            </p>

            <div className="study-layout">
                <div className="timer-buttons-column">
                    <button className="timer-btn-start" onClick={handleStart} type="button">
                        START
                    </button>

                    <button className="timer-btn-pause" onClick={pauseTimer} type="button">
                        PAUSE
                    </button>
                </div>

                <div className="timer-center">
                    <div className="timer-circle">
                        {indicator}
                        <div className="timer-time">{timeString}</div>
                        <div className="timer-label">Elapsed Time</div>
                    </div>

                    <div className="timer-status">{statusMessage()}</div>
                </div>

                <div className="timer-buttons-column">
                    <button className="timer-btn-stop" onClick={handleStop} type="button">
                        STOP
                    </button>

                    <button className="timer-btn-reset" onClick={resetTimer} type="button">
                        RESET
                    </button>
                </div>
            </div>
        </section>
    );
}
