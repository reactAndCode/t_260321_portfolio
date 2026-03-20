"use client";

import { useEffect, useRef, useState } from "react";

import type { SnapshotResponse } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export function useFundingStream() {
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSnapshot = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/funding/snapshot`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Snapshot request failed: ${response.status}`);
        }
        const data = (await response.json()) as SnapshotResponse;
        if (!cancelled) {
          setSnapshot(data);
          setLoading(false);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Unknown error");
          setLoading(false);
        }
      }
    };

    void loadSnapshot();

    const source = new EventSource(`${API_BASE_URL}/api/v1/funding/stream`);
    source.addEventListener("snapshot", (event) => {
      const nextSnapshot = JSON.parse((event as MessageEvent).data) as SnapshotResponse;
      setSnapshot(nextSnapshot);
      setLoading(false);
      setError(null);
    });
    source.onerror = () => {
      setError("Streaming connection interrupted. Retrying automatically.");
    };
    sourceRef.current = source;

    return () => {
      cancelled = true;
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, []);

  return { snapshot, loading, error };
}
