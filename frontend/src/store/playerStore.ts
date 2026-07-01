import { create } from "zustand";

export interface PlayingVersion {
  projectId: string;
  projectName: string;
  trackId: string;
  trackName: string;
  versionId: string;
  versionNumber: number;
  audioUrl: string;
  notes?: string | null;
  label?: string | null;
  originalFileName?: string | null;
}

interface PlayerState {
  current: PlayingVersion | null;
  isPlaying: boolean;
  play: (version: PlayingVersion) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  current: null,
  isPlaying: false,
  play: (version) => set({ current: version, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  stop: () => set({ current: null, isPlaying: false }),
}));
