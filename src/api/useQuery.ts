import { useCallback, useEffect, useState } from "react";

export type QueryState<T> = {
  status: "loading" | "success" | "error";
  data?: T;
  error?: string;
  reload: () => void;
};

export function useQuery<T>(query: () => Promise<T>, deps: readonly unknown[]): QueryState<T> {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<Omit<QueryState<T>, "reload">>({ status: "loading" });
  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setState((current) =>
      current.data !== undefined ? { status: "loading", data: current.data } : { status: "loading" },
    );
    query().then(
      (data) => {
        if (active) setState({ status: "success", data });
      },
      (error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Something went wrong.";
        setState((current) => ({ status: "error", error: message, data: current.data }));
      },
    );
    return () => {
      active = false;
    };
    // The caller passes the dependencies that should refetch the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { ...state, reload };
}
