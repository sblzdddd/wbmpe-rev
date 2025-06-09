export interface Lyric {
  id: number;
  content: string;
  lang: string;
  ext: string;
}

export interface ParsedLyric {
  id: number;
  lyric: Lyric;
  lines: LyricLine[];
  ext: string;
}

export interface LyricLine {
  text: string;
  start: number;
  end: number;
  alt: string | undefined;
}