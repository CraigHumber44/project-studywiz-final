export default function SettingsPanel() {
    return (
        <aside className="settings-panel">
            <h4><strong>Settings</strong></h4>

            <div className="settings-section">
                <h1>Theme</h1>
                <button>Dark</button>
                <button>Light</button>
            </div>

            <div className="settings-section">
                <p>3 hrs Auto Pause</p>
                <label>
                    <input type="checkbox" /> On
                </label>
                <label>
                    <input type="checkbox" /> Off
                </label>
            </div>

            <div className="settings-section">
                <p>Notifications</p>
                <label>
                    <input type="checkbox" /> On
                </label>
                <label>
                    <input type="checkbox" /> Off
                </label>
            </div>
        </aside>
    );
}

