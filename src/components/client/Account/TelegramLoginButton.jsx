// TelegramLoginButton.jsx
import React, { useEffect, useRef } from "react";

export default function TelegramLoginButton({ botUsername, onAuth }) {
  const containerRef = useRef(null);
  const callbackNameRef = useRef("");

  useEffect(() => {
    if (!botUsername) return;

    // define unique global callback (Telegram requires a global function)
    const cbName = "__tgAuthCB_" + Math.random().toString(36).slice(2);
    callbackNameRef.current = cbName;
    window[cbName] = (tgUser) => onAuth?.(tgUser);

    // inject script
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "true");
    script.setAttribute("data-onauth", cbName);
    script.setAttribute("data-request-access", "write");

    containerRef.current?.appendChild(script);

    return () => {
      // cleanup
      try { delete window[cbName]; } catch {}
      if (script && containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [botUsername, onAuth]);

  return <div ref={containerRef} />;
}
