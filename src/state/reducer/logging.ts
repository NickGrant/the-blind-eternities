import type { SessionState } from "../session.types";

const MAX_LOG_ENTRIES = 200;

export function appendLog(
  state: SessionState,
  entry: Pick<SessionState["log"]["entries"][number], "atMs" | "level" | "message" | "meta">
): SessionState {
  const nextEntry = {
    id: `log_${entry.atMs}_${state.log.entries.length}`,
    atMs: entry.atMs,
    level: entry.level,
    message: entry.message,
    meta: entry.meta,
  };

  return {
    ...state,
    log: {
      ...state.log,
      entries: [...state.log.entries, nextEntry].slice(-MAX_LOG_ENTRIES),
    },
  };
}

