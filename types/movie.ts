export interface Movie {
  imdbId: string;
  title: string;
  year: string;
  poster: string;
  plot?: string;
  runtime?: string;
  rating?: string;
  cast?: string;
  director?: string;
  type: 'movie' | 'tv';
  hasStreams?: boolean;
  streamingData?: {
    playlist: any;
    key: any;
    title?: string;
  };
}

export interface StreamingLink {
  quality: string;
  language: string;
  source: string;
  url: string;
}