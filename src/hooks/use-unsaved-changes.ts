"use client";

import { useEffect } from "react";

const DEFAULT_MESSAGE = "لديك تغييرات غير محفوظة. هل تريد المغادرة دون حفظ؟";

/**
 * Warns before leaving with unsaved changes: browser reload/close/external
 * navigation (`beforeunload`) and in-app `<a>` / `<Link>` clicks. The App
 * Router has no navigation events, so link clicks are intercepted in the
 * capture phase before Next's handler runs.
 */
export function useUnsavedChangesWarning(
  dirty: boolean,
  message: string = DEFAULT_MESSAGE,
) {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href, window.location.href);
      const sameDocument =
        url.origin === window.location.origin &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search;
      if (sameDocument) return;

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, message]);
}
