"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";

export default function TopBarActions() {
    const { user, login, logout, lang, setLang } = useApp();

    const [showLogin, setShowLogin] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [err, setErr] = useState("");

    // Lets other components (like START) open the login modal without changing layouts
    useEffect(() => {
        const onOpen = () => {
            setErr("");
            setShowLogin(true);
        };

        window.addEventListener("openLogin", onOpen);
        return () => window.removeEventListener("openLogin", onOpen);
    }, []);

    const openModal = () => {
        setErr("");
        setShowLogin(true);
    };

    const closeModal = () => {
        setShowLogin(false);
        setErr("");
    };

    const handleContinue = () => {
        const n = name.trim();
        const e = email.trim();

        // Basic validation
        if (!n) {
            setErr("Enter your name.");
            return;
        }

        if (!e || !e.includes("@") || !e.includes(".")) {
            setErr("Enter a valid email.");
            return;
        }

        const res = login({ name: n, email: e });

        if (!res.ok) {
            setErr(res.message); // e.g. "Name does not match the email used previously."
            return;
        }

        // Success only
        setName("");
        setEmail("");
        setErr("");
        closeModal();
    };

    const handleAuthClick = () => {
        // If logged in, this button is a logout
        if (user) {
            logout();
            return;
        }

        // If guest, this button opens login
        openModal();
    };

    return (
        <>
            <div className="topbar-actions">
                {/* Language selector */}
                <select
                    className="topbar-select"
                    value={lang}
                    onChange={(e) => setLang(e.target.value as any)}
                    aria-label="Language selector"
                >
                    <option value="en">EN</option>
                    <option value="fr">FR</option>
                    <option value="es">ES</option>
                </select>

                {/* Auth button, shows Login for guests, Logout for logged in users */}
                <button
                    type="button"
                    className="topbar-login-btn"
                    onClick={handleAuthClick}
                    title={user ? "Logout" : "Login"}
                >
                    {user ? "Logout" : "Login"}
                </button>
            </div>

            {/* Login modal (opens on Login click or when START triggers openLogin event) */}
            {showLogin && (
                <div className="login-overlay" role="dialog" aria-modal="true" aria-label="Login">
                    <div className="login-card">
                        <h3 className="login-title">Login</h3>

                        <label className="login-label">
                            Name
                            <input
                                className="login-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                            />
                        </label>

                        <label className="login-label">
                            Email
                            <input
                                className="login-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@email.com"
                            />
                        </label>

                        {err ? (
                            <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem", color: "#ff8a8a" }}>
                                {err}
                            </p>
                        ) : null}

                        <div className="login-actions">
                            <button type="button" className="login-btn" onClick={handleContinue}>
                                Continue
                            </button>

                            <button type="button" className="login-btn secondary" onClick={closeModal}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

