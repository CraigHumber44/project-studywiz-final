"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";

type NavItem = {
    href: string;
    label: string;
    iconSrc: string;
};

export default function Sidebar() {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(false);

    //keep icons simple and readable
    const navItems: NavItem[] = useMemo(
        () => [
            { href: "/", label: "HOME", iconSrc: "/assets/icons/home.svg" },
            { href: "/studies", label: "STUDIES", iconSrc: "/assets/icons/book.svg" },
            { href: "/materials", label: "MATERIALS", iconSrc: "/assets/icons/documents.svg" },
            { href: "/overview", label: "OVERVIEW", iconSrc: "/assets/icons/chart-column.svg" },
            { href: "/due-dates", label: "DUE DATES", iconSrc: "/assets/icons/calendar.svg" },
        ],
        []
    );

    // Home must only be active on "/"
    const isActiveRoute = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname?.startsWith(href);
    };

    // single share handler so heart + button behave the same
    const handleShare = () => {
        alert("Share feature coming soon.");
    };

    return (
        <aside className={`sidebar ${isExpanded ? "sidebar-expanded" : "sidebar-collapsed"}`}>
            {/* HEADER */}
            <div className="sidebar-header">
                <button
                    type="button"
                    className="sidebar-menu-btn"
                    onClick={() => setIsExpanded((v) => !v)}
                    aria-label={isExpanded ? "Close Menu Bar" : "Open Menu"}
                    title={isExpanded ? "Close Menu Bar" : "Open Menu"}
                >
                    <Image
                        src="/assets/icons/open-menu.svg"
                        alt="Open menu"
                        width={22}
                        height={22}
                        className="sidebar-svg-img"
                        priority
                    />
                </button>

                {isExpanded ? (
                    <>
                        <div className="sidebar-header-title">Menu</div>

                        <button
                            type="button"
                            className="sidebar-close-box"
                            onClick={() => setIsExpanded(false)}
                            aria-label="Close"
                            title="Close"
                        >
                            ◀
                        </button>
                    </>
                ) : (
                    <div className="sidebar-open-label">Open Menu</div>
                )}
            </div>

            {/* NAVIGATION */}
            <nav className="sidebar-nav" aria-label="User Study Hub">
                <ul className="sidebar-list">
                    {navItems.map((item) => {
                        const active = isActiveRoute(item.href);

                        return (
                            <li key={item.href} className="sidebar-item">
                                <Link
                                    href={item.href}
                                    className={[
                                        "sidebar-link",
                                        active ? "sidebar-link-active" : "",
                                        isExpanded ? "sidebar-link-expanded" : "sidebar-link-collapsed",
                                    ].join(" ")}
                                    aria-current={active ? "page" : undefined}
                                    title={!isExpanded ? item.label : undefined}
                                >
                                    <span className="sidebar-icon">
                                        <Image
                                            src={item.iconSrc}
                                            alt=""
                                            width={22}
                                            height={22}
                                            className="sidebar-svg-img"
                                        />
                                    </span>

                                    {isExpanded && <span className="sidebar-text">{item.label}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* BOTTOM ACTIONS */}
            <div className="sidebar-bottom">
                {/* Heart icon triggers the same share action */}
                <button
                    type="button"
                    className="sidebar-heart"
                    aria-label="Share"
                    title="Share"
                    onClick={handleShare}
                >
                    <Image
                        src="/assets/icons/heart.svg"
                        alt="Share"
                        width={22}
                        height={22}
                        className="sidebar-svg-img sidebar-heart-svg-img"
                    />
                </button>

                {isExpanded && (
                    <button
                        type="button"
                        className="sidebar-share-btn"
                        onClick={handleShare}
                    >
                        Share
                    </button>
                )}
            </div>
        </aside>
    );
}
