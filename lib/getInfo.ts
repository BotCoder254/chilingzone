import axios from "axios";
import * as cheerio from "cheerio";
import { getPlayerUrl } from "./getPlayerUrl";

const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive'
  }
});

async function searchMovieByTitle(title: string): Promise<string | null> {
  try {
    const searchUrl = 'https://allmovieland.link/search';
    const response = await axiosInstance.get(searchUrl, {
      params: { q: title },
      headers: {
        'Referer': 'https://allmovieland.link'
      }
    });

    const $ = cheerio.load(response.data);
    const firstResult = $('.movie-item').first();
    const movieLink = firstResult.find('a').attr('href');
    
    if (movieLink) {
      // Extract the movie ID from the link
      const match = movieLink.match(/\/movie\/([^/]+)/);
      return match ? match[1] : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error searching movie:', error);
    return null;
  }
}

export default async function getInfo(id: string) {
  try {
    let movieId = id;
    let retryCount = 0;
    const maxRetries = 3;
    
    // If the ID looks like a TMDB ID (numeric) or a title, try to search for it
    if (!id.startsWith('tt') || isNaN(Number(id.slice(2)))) {
      const searchResult = await searchMovieByTitle(id);
      if (!searchResult) {
      return {
        success: false,
          message: "Movie not found",
        };
      }
      movieId = searchResult;
    }

    while (retryCount < maxRetries) {
      try {
        const playerUrl = await getPlayerUrl();
        console.log(`Attempt ${retryCount + 1}: Using player URL: ${playerUrl}`);
        
        const response = await axiosInstance.get(`${playerUrl}/play/${movieId}`, {
          headers: {
            'Origin': 'https://allmovieland.link',
            'Referer': 'https://google.com',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
          }
        });

        const $ = cheerio.load(response.data);
        const script = $("script").last().html()!;
        
        if (!script) {
          throw new Error("Script not found");
        }

        const content = script.match(/(\{[^;]+});/)?.[1] || script.match(/\((\{.*\})\)/)?.[1];
        
        if (!content) {
          throw new Error("Content not found");
        }

    const data = JSON.parse(content);
    const file = data["file"];
    const key = data["key"];

        if (!file || !key) {
          throw new Error("Missing file or key");
        }

        const playlistRes = await axiosInstance.get(`${playerUrl}${file}`, {
      headers: {
            'Origin': 'https://allmovieland.link',
            'X-Csrf-Token': key,
            'Referer': `https://allmovieland.link/play/${movieId}`,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors'
          }
        });

    return {
      success: true,
      data: {
            playlist: playlistRes.data,
        key,
      },
        };
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        if (retryCount === maxRetries) {
          return {
            success: false,
            message: "Failed to get media info after multiple attempts",
          };
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    return {
      success: false,
      message: "Maximum retries exceeded",
    };
  } catch (error) {
    console.error("Error getting media info:", error);
    return {
      success: false,
      message: "Something went wrong",
    };
  }
}