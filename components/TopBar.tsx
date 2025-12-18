import Link from "next/link";
import Image from "next/image";
import TopBarActions from "@/components/TopBarActions";

export default function TopBar() {
    return (
        <header className="topbar">
            <div className="topbar-left">
                <Link href="/" className="logo-box" aria-label="Go to Home">
                    <Image
                        src="/assets/logo/logo.png"
                        alt="StudyWiz logo"
                        width={36}
                        height={36}
                        priority
                    />
                </Link>
            </div>

            <div className="topbar-center" />

            <div className="topbar-right">
                <TopBarActions />
            </div>
        </header>
    );
}



