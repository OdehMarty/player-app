import { Filesystem, type ReaddirResult, type StatResult } from '@capacitor/filesystem';
import type { ScanDirectory, ScanResult, VideoFile } from '../types/video';
import { groupVideosForLibrary, parseVideoFilename } from './parseVideoFilename';

export const DEFAULT_MOVIEBOX_DOWNLOAD_PATH = '/storage/emulated/0/Android/data/com.community.oneroom/files/Download/d';
export const DEFAULT_BOXPLAYER_DOWNLOAD_PATH = '/storage/emulated/0/BoxPlayer/downloads';

export const GENERAL_VIDEO_DIRECTORIES = [
  '/storage/emulated/0/DCIM',
  '/storage/emulated/0/Movies',
  '/storage/emulated/0/Videos',
  '/storage/emulated/0/Download',
  '/storage/emulated/0/WhatsApp/Media/WhatsApp Video',
] as const;

export const VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.mov', '.mkv', '.webm', '.avi', '.3gp'] as const;

export interface ScanOptions {
  movieBoxPath?: string;
  boxPlayerDownloadPath?: string;
  includeGeneralDirectories?: boolean;
  maxDepth?: number;
}

const trimTrailingSlash = (path: string): string => path.replace(/\/+$/g, '');

const joinPath = (directory: string, child: string): string => `${trimTrailingSlash(directory)}/${child}`;

const isVideoFile = (filename: string): boolean => {
  const lowerFilename = filename.toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => lowerFilename.endsWith(extension));
};

const toFileUri = (absolutePath: string): string => `file://${absolutePath}`;

const isDirectoryEntry = (entry: string | { type?: string }): boolean => typeof entry !== 'string' && entry.type === 'directory';

const getEntryName = (entry: string | { name: string }): string => (typeof entry === 'string' ? entry : entry.name);

const buildScanDirectories = (options: ScanOptions): ScanDirectory[] => {
  const movieBoxPath = options.movieBoxPath ?? DEFAULT_MOVIEBOX_DOWNLOAD_PATH;
  const boxPlayerDownloadPath = options.boxPlayerDownloadPath ?? DEFAULT_BOXPLAYER_DOWNLOAD_PATH;
  const directories: ScanDirectory[] = [
    { path: movieBoxPath, sourceTag: 'moviebox', recursive: false },
    { path: boxPlayerDownloadPath, sourceTag: 'social', recursive: true },
  ];

  if (options.includeGeneralDirectories ?? true) {
    GENERAL_VIDEO_DIRECTORIES.forEach((path) => {
      directories.push({ path, sourceTag: 'general', recursive: true });
    });
  }

  return directories;
};

const readDirectory = async (path: string): Promise<ReaddirResult> => Filesystem.readdir({ path });

const statPath = async (path: string): Promise<StatResult | undefined> => {
  try {
    return await Filesystem.stat({ path });
  } catch {
    return undefined;
  }
};

const scanDirectory = async (
  directory: ScanDirectory,
  failedDirectories: ScanResult['failedDirectories'],
  depth: number,
  maxDepth: number,
): Promise<VideoFile[]> => {
  const videos: VideoFile[] = [];
  let directoryResult: ReaddirResult;

  try {
    directoryResult = await readDirectory(directory.path);
  } catch (caughtError) {
    failedDirectories.push({
      path: directory.path,
      reason: caughtError instanceof Error ? caughtError.message : 'Unable to read directory.',
    });
    return videos;
  }

  await Promise.all(
    directoryResult.files.map(async (entry) => {
      const filename = getEntryName(entry);
      const absolutePath = joinPath(directory.path, filename);

      if (isDirectoryEntry(entry) && directory.recursive && depth < maxDepth) {
        const nestedVideos = await scanDirectory({ ...directory, path: absolutePath }, failedDirectories, depth + 1, maxDepth);
        videos.push(...nestedVideos);
        return;
      }

      if (!isVideoFile(filename)) return;

      const stat = await statPath(absolutePath);
      const parsedVideo = parseVideoFilename(filename, directory.sourceTag);

      videos.push({
        ...parsedVideo,
        id: `${directory.sourceTag}:${absolutePath}`,
        filename,
        absolutePath,
        fileUri: toFileUri(absolutePath),
        directory: directory.path,
        sizeBytes: stat?.size,
        modifiedAt: stat?.mtime,
      });
    }),
  );

  return videos;
};

export const scanVideoDirectories = async (options: ScanOptions = {}): Promise<ScanResult> => {
  const scannedDirectories = buildScanDirectories(options);
  const failedDirectories: ScanResult['failedDirectories'] = [];
  const maxDepth = options.maxDepth ?? 4;
  const videosByDirectory = await Promise.all(
    scannedDirectories.map((directory) => scanDirectory(directory, failedDirectories, 0, maxDepth)),
  );
  const videos = videosByDirectory.flat();

  return {
    videos,
    groups: groupVideosForLibrary(videos),
    scannedDirectories,
    failedDirectories,
  };
};
