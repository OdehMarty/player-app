import { Filesystem, type ReaddirResult, type StatResult } from '@capacitor/filesystem';
import type { ScanDirectory, ScanResult, VideoFile, VideoSourceTag } from '../types/video';
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
  const lower = filename.toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => lower.endsWith(extension));
};

const toFileUri = (path: string): string => `file://${path}`;

const buildDirectories = (options: ScanOptions): ScanDirectory[] => {
  const movieBoxPath = options.movieBoxPath ?? DEFAULT_MOVIEBOX_DOWNLOAD_PATH;
  const boxPlayerDownloadPath = options.boxPlayerDownloadPath ?? DEFAULT_BOXPLAYER_DOWNLOAD_PATH;
  const directories: ScanDirectory[] = [
    { path: movieBoxPath, sourceTag: 'moviebox', recursive: false },
    { path: boxPlayerDownloadPath, sourceTag: 'social', recursive: true },
  ];

  if (options.includeGeneralDirectories ?? true) {
    GENERAL_VIDEO_DIRECTORIES.forEach((path) => directories.push({ path, sourceTag: 'general', recursive: true }));
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

  let result: ReaddirResult;
  try {
    result = await readDirectory(directory.path);
  } catch (error) {
    failedDirectories.push({ path: directory.path, reason: error instanceof Error ? error.message : 'Unable to read directory' });
    return videos;
  }

  await Promise.all(
    result.files.map(async (entry: string | { name: string; type?: string }) => {
      const filename = typeof entry === 'string' ? entry : entry.name;
      const entryType = typeof entry === 'string' ? undefined : entry.type;
      const absolutePath = joinPath(directory.path, filename);

      if (entryType === 'directory' && directory.recursive && depth < maxDepth) {
        videos.push(
          ...(await scanDirectory({ ...directory, path: absolutePath }, failedDirectories, depth + 1, maxDepth)),
        );
        return;
      }

      if (!isVideoFile(filename)) return;

      const stat = await statPath(absolutePath);
      const parsed = parseVideoFilename(filename, directory.sourceTag as VideoSourceTag);

      videos.push({
        ...parsed,
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
  const scannedDirectories = buildDirectories(options);
  const failedDirectories: ScanResult['failedDirectories'] = [];
  const maxDepth = options.maxDepth ?? 4;
  const videos = (
    await Promise.all(scannedDirectories.map((directory) => scanDirectory(directory, failedDirectories, 0, maxDepth)))
  ).flat();

  return {
    videos,
    groups: groupVideosForLibrary(videos),
    scannedDirectories,
    failedDirectories,
  };
};
