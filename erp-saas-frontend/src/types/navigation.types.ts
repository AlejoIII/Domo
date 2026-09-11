export interface NavigationPrefs {
  itemOrder?: string[];
  hiddenIds?: string[];
  childOrder?: Record<string, string[]>;
}

export interface NavigationSettingsResponse {
  prefs: NavigationPrefs;
  plan: {
    code: string;
    name: string;
    features: Record<string, boolean>;
  };
}

export interface NavigationMenuEntry {
  id: string;
  label: string;
  planFeature?: string | null;
  children?: { id: string; label: string }[];
}
