"use client";

import { useState } from "react";

export default function Footer() {
    const [showSupport, setShowSupport] = useState(false);

    return (
        <>
            {/* Floating Support Popup */}
            {showSupport && (
                <div className="support-floating-banner">
                    <p className="support-title">How can we help you?</p>

                    <button className="support-option disabled">
                        Chat with Agent (Coming Soon)
                    </button>

                    <button
                        className="support-option"
                        onClick={() => alert("Contact form implementation coming soon")}
                    >
                        Contact Us
                    </button>

                    <button
                        className="support-close"
                        onClick={() => setShowSupport(false)}
                    >
                        Close
                    </button>
                </div>
            )}

            {/* Footer */}
            <footer className="footer">

                <p className="footer-center">© 2025 StudyWiz. All rights reserved.</p>
                <div className="footer-left">
                </div>

                {/* SUPPORT ON FAR RIGHT */}
                <div className="footer-right">
                    <button
                        onClick={() => setShowSupport(true)}
                        className="footer-support-btn"
                    >
                        Support
                    </button>
                </div>


            </footer>
        </>
    );
}
