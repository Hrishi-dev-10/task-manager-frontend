import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { useMatches } from "react-router";

export type Crumb = {
  label: string;
  to?: string;
};

export type RouteHandle = {
  title: string;
  breadcrumb?: Crumb[];
};

export function isRouteHandle(value: unknown): value is RouteHandle {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    typeof value.title === "string"
  );
}

const PageMetaOverrideContext = createContext<RouteHandle | null>(null);
const SetPageMetaContext = createContext<(value: RouteHandle | null) => void>(() => {});

export function PageMetaProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<RouteHandle | null>(null);
  return createElement(
    SetPageMetaContext.Provider,
    { value: setOverride },
    createElement(PageMetaOverrideContext.Provider, { value: override }, children),
  );
}

/** Replace the header title while this page is open. Clears on leave. */
export function useSetPageMeta(meta: RouteHandle | null) {
  const setOverride = useContext(SetPageMetaContext);
  const key = meta
    ? `${meta.title}\n${(meta.breadcrumb ?? []).map((crumb) => `${crumb.label}|${crumb.to ?? ""}`).join(">")}`
    : "";

  useEffect(() => {
    setOverride(meta);
    return () => setOverride(null);
    // `key` tracks the title and breadcrumb contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setOverride, key]);
}

export function usePageMeta() {
  const override = useContext(PageMetaOverrideContext);
  const handle = [...useMatches()].reverse().map((match) => match.handle).find(isRouteHandle);
  return {
    title: override?.title ?? handle?.title ?? "Task Master",
    breadcrumb: override?.breadcrumb ?? handle?.breadcrumb ?? [],
  };
}
