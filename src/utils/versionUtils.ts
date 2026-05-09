import { APP_VERSION } from '../constants/version';

/**
 * Compares two semantic version strings.
 * Returns:
 * - 1 if v1 > v2
 * - -1 if v1 < v2
 * - 0 if v1 == v2
 */
export const compareVersions = (v1: string, v2: string): number => {
  const v1Parts = v1.replace(/^v/, '').split('.').map(Number);
  const v2Parts = v2.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  return 0;
};

/**
 * Checks if an update is available
 * @param latestVersion Latest available version from server
 * @param currentVersion Current app version (defaults to APP_VERSION)
 */
export const isUpdateAvailable = (latestVersion: string, currentVersion: string = APP_VERSION): boolean => {
  if (!currentVersion || !latestVersion) return false;
  return compareVersions(latestVersion, currentVersion) === 1;
};

export { APP_VERSION };
