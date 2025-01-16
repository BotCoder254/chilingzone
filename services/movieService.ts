import axios from 'axios';
import { Movie, StreamingLink } from '../types/movie';
import getInfo from '../lib/getInfo';
import { getPlayerUrl } from '../lib/getPlayerUrl';

async function getStreamingLinks(mediaInfo: any): Promise<StreamingLink[]> {
  try {
    const streamingLinks: StreamingLink[] = [];
    const playerUrl = await getPlayerUrl();
    
    if (!mediaInfo.data?.playlist) {
      return streamingLinks;
    }

    const playlist = mediaInfo.data.playlist;
    for (const item of playlist) {
      if (item.file) {
        const streamUrl = `${playerUrl}/playlist/${item.file.slice(1)}.txt`;
        try {
          const response = await axios.get(streamUrl, {
            headers: {
              Accept: "*/*",
              "Accept-Encoding": "gzip, deflate, br",
              "Accept-Language": "en-US,en;q=0.9",
              "Cache-Control": "no-cache",
              "Content-Type": "application/x-www-form-urlencoded",
              Origin: "https://friness-cherlormur-i-275.site",
              Referer: "https://google.com/",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "X-Csrf-Token": mediaInfo.data.key
            }
          });
          
          streamingLinks.push({
            quality: 'HD',
            language: item.title,
            source: 'Internal',
            url: response.data
          });
        } catch (error) {
          console.error('Error getting stream URL:', error);
        }
      }
    }
    
    return streamingLinks;
  } catch (error) {
    console.error('Error getting streaming links:', error);
    return [];
  }
}

class MovieService {
  private readonly TMDB_BASE_URL = 'https://api.themoviedb.org/3';
  private readonly headers = {
    'accept': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZGJjNWQwZWE5ZTQ5OWFhZWJhNzNkMjljMjE3MjZiZSIsIm5iZiI6MTcxMDQwNTg3OS42NDk5OTk5LCJzdWIiOiI2NWYyYjhmNzJmZGVjNjAxODkyMzZlODEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.BLGjtWjVCugLX4vnlc1k27EIU1HFf-YzR1BIrbAiXWM'
  };

  async searchMovies(query: string, page: number = 1): Promise<{ results: Movie[], totalPages: number }> {
    try {
      // First get media info from our API
      const mediaInfo = await getInfo(query);
      if (!mediaInfo.success || !mediaInfo.data) {
        return { results: [], totalPages: 0 };
      }

      // Get TMDB metadata
      const response = await axios.get(`${this.TMDB_BASE_URL}/search/multi`, {
        params: {
          query,
          page,
          include_adult: false
        },
        headers: this.headers
      });

      const results = await Promise.all(
        response.data.results
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .map(async (item: any) => {
            try {
              const details = await this.getTMDBDetails(item.id, item.media_type);
              return this.transformTMDBResult({
                ...item,
                ...details,
                hasStreams: true,
                streamingData: mediaInfo.data
              });
            } catch (error) {
              console.error('Error processing search result:', error);
              return null;
            }
          })
      );

      return {
        results: results.filter(result => result !== null) as Movie[],
        totalPages: response.data.total_pages
      };
    } catch (error) {
      console.error('Error searching movies:', error);
      return { results: [], totalPages: 0 };
    }
  }

  async getMovieDetails(imdbId: string): Promise<{ movie: Movie | null, streamingLinks: StreamingLink[], similarMovies: Movie[] }> {
    try {
      // Get media info from our API
      const mediaInfo = await getInfo(imdbId);
      if (!mediaInfo.success || !mediaInfo.data) {
        return { movie: null, streamingLinks: [], similarMovies: [] };
      }

      // Get streaming links
      const streamingLinks = await getStreamingLinks(mediaInfo);

      // Get TMDB metadata
      const movieResponse = await axios.get(`${this.TMDB_BASE_URL}/find/${imdbId}`, {
        params: {
          external_source: 'imdb_id'
        },
        headers: this.headers
      });

      const tmdbResult = movieResponse.data.movie_results[0];
      if (!tmdbResult) {
        return {
          movie: {
            imdbId,
            title: (mediaInfo.data as any).title || 'Unknown Title',
            year: '',
            poster: '',
            type: 'movie',
            hasStreams: true,
            streamingData: mediaInfo.data
          },
          streamingLinks,
          similarMovies: []
        };
      }

      // Get similar content
      const tmdbId = tmdbResult.id;
      const [details, similarResponse] = await Promise.all([
        this.getTMDBDetails(tmdbId, 'movie'),
        axios.get(`${this.TMDB_BASE_URL}/movie/${tmdbId}/similar`, {
          params: { page: 1 },
          headers: this.headers
        })
      ]);

      const similarMovies = await Promise.all(
        similarResponse.data.results
          .slice(0, 5)
          .map(async (item: any) => {
            try {
              const details = await this.getTMDBDetails(item.id, 'movie');
              const imdbId = details.imdb_id;
              if (imdbId) {
                const mediaInfo = await getInfo(imdbId);
                return this.transformTMDBResult({
                  ...item,
                  ...details,
                  hasStreams: mediaInfo.success && mediaInfo.data,
                  streamingData: mediaInfo.success ? mediaInfo.data : undefined
                });
              }
              return this.transformTMDBResult({
                ...item,
                ...details,
                hasStreams: false
              });
            } catch (error) {
              console.error('Error processing similar movie:', error);
              return null;
            }
          })
      );

      return {
        movie: this.transformTMDBResult({ 
          ...tmdbResult, 
          ...details, 
          hasStreams: true,
          streamingData: mediaInfo.data
        }),
        streamingLinks,
        similarMovies: similarMovies.filter(movie => movie !== null) as Movie[]
      };
    } catch (error) {
      console.error('Error getting movie details:', error);
      return { movie: null, streamingLinks: [], similarMovies: [] };
    }
  }

  async getFeaturedContent(): Promise<{ movies: Movie[], series: Movie[] }> {
    try {
      // Get popular content from TMDB
      const [moviesResponse, seriesResponse] = await Promise.all([
        axios.get(`${this.TMDB_BASE_URL}/movie/popular`, {
          params: { page: 1 },
          headers: this.headers
        }),
        axios.get(`${this.TMDB_BASE_URL}/tv/popular`, {
          params: { page: 1 },
          headers: this.headers
        })
      ]);

      // Process movies
      const movies = await Promise.all(
        moviesResponse.data.results
          .slice(0, 8)
          .map(async (item: any) => {
            try {
              const details = await this.getTMDBDetails(item.id, 'movie');
              const imdbId = details.imdb_id;
              if (imdbId) {
                const mediaInfo = await getInfo(imdbId);
                if (mediaInfo.success && mediaInfo.data) {
                  return this.transformTMDBResult({
                    ...item,
                    ...details,
                    hasStreams: true,
                    streamingData: mediaInfo.data
                  });
                }
              }
              return null;
            } catch (error) {
              console.error('Error processing movie:', error);
              return null;
            }
          })
      );

      // Process series
      const series = await Promise.all(
        seriesResponse.data.results
          .slice(0, 8)
          .map(async (item: any) => {
            try {
              const details = await this.getTMDBDetails(item.id, 'tv');
              const imdbId = details.imdb_id;
              if (imdbId) {
                const mediaInfo = await getInfo(imdbId);
                if (mediaInfo.success && mediaInfo.data) {
                  return this.transformTMDBResult({
                    ...item,
                    ...details,
                    hasStreams: true,
                    streamingData: mediaInfo.data
                  });
                }
              }
              return null;
            } catch (error) {
              console.error('Error processing series:', error);
              return null;
            }
          })
      );

      return {
        movies: movies.filter(movie => movie !== null) as Movie[],
        series: series.filter(series => series !== null) as Movie[]
      };
    } catch (error) {
      console.error('Error getting featured content:', error);
      return { movies: [], series: [] };
    }
  }

  async getMovies({ page = 1, search, genre, sort = 'popular' }: { 
    page?: number; 
    search?: string; 
    genre?: string; 
    sort?: string; 
  }): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      let endpoint = '/discover/movie';
      let params: any = {
        page,
        include_adult: false
      };

      if (search) {
        endpoint = '/search/movie';
        params.query = search;
      } else {
        // Apply sorting
        switch (sort) {
          case 'latest':
            params.sort_by = 'release_date.desc';
            break;
          case 'rating':
            params.sort_by = 'vote_average.desc';
            params.vote_count_gte = 100; // Ensure some minimum votes
            break;
          default: // popular
            params.sort_by = 'popularity.desc';
        }

        // Apply genre filter
        if (genre) {
          const genreMap: { [key: string]: number } = {
            action: 28,
            comedy: 35,
            drama: 18,
            horror: 27,
            'sci-fi': 878
          };
          if (genreMap[genre]) {
            params.with_genres = genreMap[genre];
          }
        }
      }

      const response = await axios.get(`${this.TMDB_BASE_URL}${endpoint}`, {
        params,
        headers: this.headers
      });

      const movies = await Promise.all(
        response.data.results.map(async (item: any) => {
          try {
            const details = await this.getTMDBDetails(item.id, 'movie');
            const imdbId = details.imdb_id;
            if (imdbId) {
              const mediaInfo = await getInfo(imdbId);
              if (mediaInfo.success && mediaInfo.data) {
                return this.transformTMDBResult({
                  ...item,
                  ...details,
                  hasStreams: true,
                  streamingData: mediaInfo.data
                });
              }
            }
            return this.transformTMDBResult({
              ...item,
              ...details,
              hasStreams: false
            });
          } catch (error) {
            console.error('Error processing movie:', error);
            return null;
          }
        })
      );

      return {
        results: movies.filter(movie => movie !== null) as Movie[],
        totalPages: response.data.total_pages
      };
    } catch (error) {
      console.error('Error getting movies:', error);
      return { results: [], totalPages: 0 };
    }
  }

  async getSeries({ page = 1, search, genre, sort = 'popular' }: { 
    page?: number; 
    search?: string; 
    genre?: string; 
    sort?: string; 
  }): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      let endpoint = '/discover/tv';
      let params: any = {
        page,
        include_adult: false
      };

      if (search) {
        endpoint = '/search/tv';
        params.query = search;
      } else {
        // Apply sorting
        switch (sort) {
          case 'latest':
            params.sort_by = 'first_air_date.desc';
            break;
          case 'rating':
            params.sort_by = 'vote_average.desc';
            params.vote_count_gte = 100;
            break;
          default: // popular
            params.sort_by = 'popularity.desc';
        }

        // Apply genre filter
        if (genre) {
          const genreMap: { [key: string]: number } = {
            action: 10759, // Action & Adventure
            comedy: 35,
            drama: 18,
            horror: 9648, // Mystery (since Horror is not a TV genre)
            'sci-fi': 10765 // Sci-Fi & Fantasy
          };
          if (genreMap[genre]) {
            params.with_genres = genreMap[genre];
          }
        }
      }

      const response = await axios.get(`${this.TMDB_BASE_URL}${endpoint}`, {
        params,
        headers: this.headers
      });

      const series = await Promise.all(
        response.data.results.map(async (item: any) => {
          try {
            const details = await this.getTMDBDetails(item.id, 'tv');
            const imdbId = details.imdb_id;
            if (imdbId) {
              const mediaInfo = await getInfo(imdbId);
              if (mediaInfo.success && mediaInfo.data) {
                return this.transformTMDBResult({
                  ...item,
                  ...details,
                  hasStreams: true,
                  streamingData: mediaInfo.data
                });
              }
            }
            return this.transformTMDBResult({
              ...item,
              ...details,
              hasStreams: false
            });
          } catch (error) {
            console.error('Error processing series:', error);
            return null;
          }
        })
      );

      return {
        results: series.filter(series => series !== null) as Movie[],
        totalPages: response.data.total_pages
      };
    } catch (error) {
      console.error('Error getting series:', error);
      return { results: [], totalPages: 0 };
    }
  }

  private async getTMDBDetails(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<any> {
    try {
      const [details, credits] = await Promise.all([
        axios.get(`${this.TMDB_BASE_URL}/${mediaType}/${tmdbId}`, {
          params: {
            append_to_response: 'external_ids'
          },
          headers: this.headers
        }),
        axios.get(`${this.TMDB_BASE_URL}/${mediaType}/${tmdbId}/credits`, {
          headers: this.headers
        })
      ]);

      return {
        ...details.data,
        imdb_id: details.data.external_ids?.imdb_id,
        credits: credits.data
      };
    } catch (error) {
      console.error(`Error getting TMDB details for ${mediaType} ${tmdbId}:`, error);
      return {};
    }
  }

  private transformTMDBResult(result: any): Movie & { hasStreams?: boolean } {
    return {
      imdbId: result.imdb_id || result.external_ids?.imdb_id || '',
      title: result.title || result.name,
      year: new Date(result.release_date || result.first_air_date).getFullYear().toString(),
      poster: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : '',
      plot: result.overview,
      rating: result.vote_average?.toFixed(1),
      runtime: result.runtime ? `${result.runtime} min` : (result.episode_run_time?.[0] ? `${result.episode_run_time[0]} min` : undefined),
      cast: result.credits?.cast?.slice(0, 5).map((actor: any) => actor.name).join(', '),
      director: result.credits?.crew?.find((crew: any) => crew.job === 'Director')?.name,
      type: result.media_type || (result.first_air_date ? 'tv' : 'movie'),
      hasStreams: result.hasStreams,
      streamingData: result.streamingData
    };
  }
}

export const movieService = new MovieService(); 