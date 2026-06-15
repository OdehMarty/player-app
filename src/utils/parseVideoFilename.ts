import type { LibraryGroup, ParsedVideo, VideoFile, VideoQuality, VideoSourceTag } from '../types/video';

const QUALITY_PATTERN = /(?:^|_)(360P|480P|720P|1080P|4K)$/i;
const EPISODE_PATTERN = /(?:^|_)S(\d{1,2})_?E(\d{1,3})(?:_|$)/i;
const EXTENSION_PATTERN = /\.[^.]+$/;

const toTitle = (value: string): string =>
  value
    .replace(/[_\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeQuality = (quality?: string): VideoQuality => {
  if (!quality) return '';
  const normalized = quality.toUpperCase();
  return ['360P', '480P', '720P', '1080P', '4K'].includes(normalized) ? (normalized as VideoQuality) : '';
};

export const stripVideoExtension = (filename: string): string => filename.replace(EXTENSION_PATTERN, '');

export const getMovieBoxBaseTitle = (filename: string): string =>
  stripVideoExtension(filename).replace(QUALITY_PATTERN, '').replace(/_+$/g, '');

export const parseVideoFilename = (filename: string, sourceTag: VideoSourceTag = 'general'): ParsedVideo => {
  const nameWithoutExtension = stripVideoExtension(filename);
  const qualityMatch = nameWithoutExtension.match(QUALITY_PATTERN);
  const quality = normalizeQuality(qualityMatch?.[1]);
  const nameWithoutQuality = qualityMatch
    ? nameWithoutExtension.slice(0, qualityMatch.index).replace(/_+$/g, '')
    : nameWithoutExtension;

  const episodeMatch = nameWithoutQuality.match(EPISODE_PATTERN);

  if (episodeMatch) {
    const titlePart = nameWithoutQuality.slice(0, episodeMatch.index).replace(/_+$/g, '');

    return {
      title: toTitle(titlePart),
      quality,
      season: Number(episodeMatch[1]),
      episode: Number(episodeMatch[2]),
      isEpisode: true,
      sourceTag,
    };
  }

  return {
    title: toTitle(nameWithoutQuality),
    quality,
    isEpisode: false,
    sourceTag,
  };
};

export const getLibraryGroupId = (video: ParsedVideo): string => {
  const titleKey = video.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${video.sourceTag}:${video.isEpisode ? 'series' : 'movie'}:${titleKey}`;
};

export const groupVideosForLibrary = (videos: VideoFile[]): LibraryGroup[] => {
  const groups = new Map<string, LibraryGroup>();

  videos.forEach((video) => {
    const id = getLibraryGroupId(video);
    const existing = groups.get(id);

    if (existing) {
      existing.videos.push(video);
      return;
    }

    groups.set(id, {
      id,
      title: video.title,
      sourceTag: video.sourceTag,
      videos: [video],
      isSeries: video.isEpisode,
    });
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    videos: group.videos.sort((a, b) => (a.season ?? 0) - (b.season ?? 0) || (a.episode ?? 0) - (b.episode ?? 0)),
  }));
};
