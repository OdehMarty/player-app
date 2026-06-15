export type VideoSourceTag = 'moviebox' | 'social' | 'general';

export type VideoQuality = '360P' | '480P' | '720P' | '1080P' | '4K' | '';

export interface ParsedVideo {
  title: string;
  quality: VideoQuality;
  season?: number;
  episode?: number;
  isEpisode: boolean;
  sourceTag: VideoSourceTag;
}

export interface VideoFile extends ParsedVideo {
  id: string;
  filename: string;
  absolutePath: string;
  fileUri: string;
  directory: string;
  sizeBytes?: number;
  modifiedAt?: number;
}

export interface LibraryGroup {
  id: string;
  title: string;
  sourceTag: VideoSourceTag;
  videos: VideoFile[];
  isSeries: boolean;
}

export interface ScanDirectory {
  path: string;
  sourceTag: VideoSourceTag;
  recursive: boolean;
}

export interface ScanResult {
  videos: VideoFile[];
  groups: LibraryGroup[];
  scannedDirectories: ScanDirectory[];
  failedDirectories: Array<{ path: string; reason: string }>;
}
