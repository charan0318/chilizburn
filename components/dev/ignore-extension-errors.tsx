"use client";

import { useEffect } from "react";

function isExtensionNoise(event: PromiseRejectionEvent): boolean {
  const reason = event.reason;
  const message =
    typeof reason === "string"
      ? reason
      : reason && typeof reason === "object" && "message" in reason
        ? String((reason as { message?: unknown }).message ?? "")
        : "";

  const stack =
    reason && typeof reason === "object" && "stack" in reason
      ? String((reason as { stack?: unknown }).stack ?? "")
      : "";

  if (stack.includes("chrome-extension://")) {
    return true;
  }

  if (message.includes("Could not establish connection. Receiving end does not exist.")) {
    return true;
  }

  if (message.includes("Cannot redefine property: ethereum")) {
    return true;
  }

  return false;
}

export function IgnoreExtensionErrors() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isExtensionNoise(event)) {
        return;
      }

      event.preventDefault();
    };

    const onError = (event: ErrorEvent) => {
      const source = String(event.filename ?? "");
      const message = String(event.message ?? "");

      if (source.includes("chrome-extension://") || message.includes("Cannot redefine property: ethereum")) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
