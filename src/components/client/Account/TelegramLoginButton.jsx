// TelegramLoginButton.jsx
import React, { useEffect, useRef } from "react";

export default function TelegramLoginButton({ botUsername, onAuth }) {
  const containerRef = useRef(null);
  // Generate a stable callback name ONCE (not per effect run)
  const cbNameRef = useRef(
    "__tgAuthCB_" + Math.random().toString(36).slice(2)
  );

  useEffect(() => {
    if (!botUsername || !containerRef.current) return;

    const cbName = cbNameRef.current;

    // Define/refresh the global callback (idempotent)
    window[cbName] = (tgUser) => {
      try { onAuth?.(tgUser); } catch {}
    };

    // Guard: if Telegram script already inserted, clear container once
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername); // EXACT username, no @
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-onauth", cbName);
    script.setAttribute("data-request-access", "write");

    containerRef.current.appendChild(script);

    // IMPORTANT: do NOT delete the global callback on cleanup in dev,
    // because StrictMode mounts -> unmounts -> mounts again.
    // Just remove the script node; keep the callback alive.
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
      // leave window[cbName] in place to survive StrictMode double-mount
    };
  }, [botUsername, onAuth]);

  return <div ref={containerRef} />;
}
