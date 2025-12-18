"use client";

import { useApp } from "@/components/AppProvider";

export default function SettingsPanel() {
    const { settings, setTheme, setNotificationsEnabled, setAutoPauseEnabled } = useApp();

    return (
        <aside className="settings-panel">
            <h3 className="settings-title">Settings</h3>

            {/* Theme */}
            <div className="settings-block">
                <div className="settings-block-title">Theme</div>

                <div className="settings-theme-buttons">
                    <button
                        type="button"
                        className={settings.theme === "dark" ? "settings-theme-btn is-active" : "settings-theme-btn"}
                        onClick={() => setTheme("dark")}
                    >
                        Dark
                    </button>

                    <button
                        type="button"
                        className={settings.theme === "light" ? "settings-theme-btn is-active" : "settings-theme-btn"}
                        onClick={() => setTheme("light")}
                    >
                        Light
                    </button>
                </div>
            </div>

            {/* Auto Pause */}
            <div className="settings-block">
                <div className="settings-block-title">Auto Pause</div>
                <div className="settings-subtitle">After {settings.autoPauseHours} hours</div>

                <div className="settings-checklist">
                    <label className="settings-check-row">
                        <input
                            type="checkbox"
                            checked={settings.autoPauseEnabled}
                            onChange={() => setAutoPauseEnabled(true)}
                        />
                        ON
                    </label>

                    <label className="settings-check-row">
                        <input
                            type="checkbox"
                            checked={!settings.autoPauseEnabled}
                            onChange={() => setAutoPauseEnabled(false)}
                        />
                        OFF
                    </label>
                </div>
            </div>

            {/* Notifications */}
            <div className="settings-block">
                <div className="settings-block-title">Notifications</div>

                <div className="settings-checklist">
                    <label className="settings-check-row">
                        <input
                            type="checkbox"
                            checked={settings.notificationsEnabled}
                            onChange={() => setNotificationsEnabled(true)}
                        />
                        ON
                    </label>

                    <label className="settings-check-row">
                        <input
                            type="checkbox"
                            checked={!settings.notificationsEnabled}
                            onChange={() => setNotificationsEnabled(false)}
                        />
                        OFF
                    </label>
                </div>
            </div>
        </aside>
    );
}

