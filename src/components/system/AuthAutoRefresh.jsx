import { useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function AuthAutoRefresh({ intervalMs = 0 }) {
  const { refreshUser } = useContext(AuthContext);

  useEffect(() => {
    const run = () => refreshUser({ silent: true });

    const onFocus = () => run();
    const onVisible = () => { if (document.visibilityState === "visible") run(); };
    const onOnline = () => run();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    let id = null;
    if (intervalMs > 0) id = setInterval(run, intervalMs);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      if (id) clearInterval(id);
    };
  }, [refreshUser, intervalMs]);

  return null;
}
