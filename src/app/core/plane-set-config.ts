import planeSetConfig from "../../assets/plane-set-config.json";

type PlaneSetConfig = {
  syncSetCodes?: string[];
  defaultSelectableSetCodes?: string[];
  labels?: Record<string, string>;
};

const config = planeSetConfig as PlaneSetConfig;

export const SYNC_PLANE_SET_CODES: readonly string[] = Object.freeze([...(config.syncSetCodes ?? [])]);
export const DEFAULT_SELECTABLE_PLANE_SET_CODES: readonly string[] = Object.freeze([
  ...(config.defaultSelectableSetCodes ?? []),
]);
export const PLANE_SET_LABELS: Readonly<Record<string, string>> = Object.freeze({
  ...(config.labels ?? {}),
});
