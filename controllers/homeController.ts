import { Request, Response } from "express";
import { movieService } from "../services/movieService";

export default async function homeController(req: Request, res: Response) {
    try {
        // Get featured and latest content
        const [
            { movies: initialFeatured }, 
            { results: latestMovies },
            { results: popularMovies },
            { results: topRatedMovies }
        ] = await Promise.all([
            movieService.getFeaturedContent(),
            movieService.getMovies({ sort: 'latest', page: 1 }),
            movieService.getMovies({ sort: 'popular', page: 1 }),
            movieService.getMovies({ sort: 'rating', page: 1 })
        ]);
        
        // Combine and sort by release date for featured section
        const featuredMovies = [...latestMovies, ...popularMovies, ...initialFeatured]
            .filter(item => item.poster && item.plot) // Only include items with required media
            .filter((item, index, self) => 
                index === self.findIndex((m) => m.imdbId === item.imdbId))
            .sort((a, b) => parseInt(b.year) - parseInt(a.year))
            .slice(0, 10);

        const categories = [
            { id: 'latest', name: 'Latest Releases', movies: latestMovies.slice(0, 10) },
            { id: 'popular', name: 'Popular Movies', movies: popularMovies.slice(0, 10) },
            { id: 'toprated', name: 'Top Rated', movies: topRatedMovies.slice(0, 10) },
            { id: 'action', name: 'Action Movies', genre: 'action' },
            { id: 'comedy', name: 'Comedy Movies', genre: 'comedy' },
            { id: 'drama', name: 'Drama Movies', genre: 'drama' },
            { id: 'scifi', name: 'Sci-Fi & Fantasy Movies', genre: 'sci-fi' },
            { id: 'horror', name: 'Horror Movies', genre: 'horror' },
            { id: 'adventure', name: 'Adventure Movies', genre: 'adventure' },
            { id: 'animation', name: 'Animation Movies', genre: 'animation' },
            { id: 'crime', name: 'Crime Movies', genre: 'crime' },
            { id: 'documentary', name: 'Documentary Movies', genre: 'documentary' },
            { id: 'family', name: 'Family Movies', genre: 'family' }
        ];

        // Fetch content for genre categories in parallel
        const categoriesWithContent = await Promise.all(
            categories.map(async (category) => {
                if (category.movies) {
                    return category;
                }
                const { results: movies } = await movieService.getMovies({
                    genre: category.genre,
                    sort: 'popular',
                    page: 1
                });
                return {
                    ...category,
                    movies: movies.filter(m => m.hasStreams).slice(0, 10)
                };
            })
        );

        res.render('index', {
            featuredMovies,
            categories: categoriesWithContent.filter(cat => cat.movies && cat.movies.length > 0)
        });
    } catch (error) {
        console.error('Home controller error:', error);
        res.render('index', {
            featuredMovies: [],
            categories: []
        });
    }
} 