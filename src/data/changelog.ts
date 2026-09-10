export interface ChangelogVersion {
  features?: string[];
  fixes?: string[];
  improvements?: string[];
}

export const CHANGELOG: Record<string, ChangelogVersion> = {
  "3.0.10": {
    features: [
      "Dynamic 'What's New' release notes popup after updating",
    ],
    fixes: [
      "Fixed progress bar jumping instantly to 100% when downloading updates",
      "Fixed missing 'Installing...' indicator while NSIS runs in the background",
    ],
    improvements: [
      "Added Developer Tools access to Settings",
      "Added debug log panel to Settings for troubleshooting update issues",
      "Updated UI components for signature positioning with keyboard support",
    ],
  },
  "3.0.9": {
    features: [],
    fixes: ["Fixed updater signature parsing issue"],
    improvements: ["Added advanced developer mode tools"],
  }
};
