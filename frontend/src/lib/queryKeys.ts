/**
 * Prefix matching is intentional: `tracks(p)` is a prefix of both `track(p, id)`
 * and `archivedTracks(p)`, so invalidating `tracks(p)` also refreshes those.
 */
export const queryKeys = {
  projects: () => ["projects"] as const,
  project: (projectId: string) => ["projects", projectId] as const,
  publicProject: (projectId: string) => ["publicProject", projectId] as const,

  tracks: (projectId: string) => ["tracks", projectId] as const,
  archivedTracks: (projectId: string) => ["tracks", projectId, "archived"] as const,
  track: (projectId: string, trackId: string) => ["tracks", projectId, trackId] as const,

  trackVersions: (projectId: string, trackId: string) =>
    ["trackVersions", projectId, trackId] as const,

  members: (projectId: string) => ["members", projectId] as const,
  tasks: (projectId: string) => ["tasks", projectId] as const,

  projectComments: (projectId: string) => ["projectComments", projectId] as const,
  trackComments: (projectId: string, trackId: string) =>
    ["trackComments", projectId, trackId] as const,
  versionComments: (projectId: string, trackId: string, versionId: string) =>
    ["versionComments", projectId, trackId, versionId] as const,
} as const;
