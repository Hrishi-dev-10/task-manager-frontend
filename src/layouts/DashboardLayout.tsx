import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useIsDesktop } from "../shared/useMediaQuery";
import { AppHeader } from "./AppHeader";
import { PageMetaProvider } from "./pageMeta";
import { readSidebarCollapsed, Sidebar, writeSidebarCollapsed } from "./Sidebar";

export default function DashboardLayout() {
  const desktop = useIsDesktop();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (desktop) setMobileOpen(false);
  }, [desktop]);

  useEffect(() => {
    if (!mobileOpen || desktop) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, desktop]);

  const drawerClosed = !desktop && !mobileOpen;

  return (
    <div className="min-h-dvh bg-base-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-content"
      >
        Skip to content
      </a>

      {mobileOpen && !desktop && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-neutral/50 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="lg:flex lg:items-start">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          drawerClosed={drawerClosed}
          onClose={() => setMobileOpen(false)}
          onToggleCollapsed={() => {
            setCollapsed((current) => {
              const next = !current;
              writeSidebarCollapsed(next);
              return next;
            });
          }}
        />
        <PageMetaProvider>
          <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
            <AppHeader navigationOpen={mobileOpen} onOpenNavigation={() => setMobileOpen(true)} />
            <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              <div className="flex w-full flex-col gap-6">
                <Outlet />
              </div>
            </main>
          </div>
        </PageMetaProvider>
      </div>
    </div>
  );
}
