import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import TopBarBottom from "@/components/TopBarBottom";
import Footer from "@/components/Footer";
import StudyControlsBar from "@/components/StudyControlsBar";
import SettingsPanel from "@/components/SettingsPanel";
import BottomSummaryBar from "@/components/BottomSummaryBar";
import { AppProvider } from "@/components/AppProvider";

export const metadata = {
  title: "StudyWiz",
  description: "Smart Study Planner and Tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="layout-root">
        <AppProvider>
          <TopBar />
          <TopBarBottom />
          <StudyControlsBar />

          <div className="layout-main-row">
            <Sidebar />
            <main className="main-content">{children}</main>
            <SettingsPanel />
          </div>

          <BottomSummaryBar />
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}

