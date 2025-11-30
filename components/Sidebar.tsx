import Link from "next/link";

export default function Sidebar() {
    return (
        <aside className="sidebar">

            <nav className="sidebar-nav">
                <p className="sidebar-nav-title">USER STUDY HUB</p>
                <ul>
                    <li>
                        <Link href="/">Home</Link>
                    </li>
                    <li>
                        <Link href="/studies">Studies</Link>
                    </li>
                    <li>
                        <Link href="/materials">Materials</Link>
                    </li>
                    <li>
                        <Link href="/overview">Overview</Link>
                    </li>
                    <li>
                        <Link href="/due-dates">Due Dates</Link>
                    </li>
                </ul>
            </nav>


            <div className="sidebar-footer">
                <button className="sidebar-share-btn">Share</button>
            </div>
        </aside>
    );
}

