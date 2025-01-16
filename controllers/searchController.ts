import { Request, Response } from "express";
import { movieService } from "../services/movieService";

export default async function searchController(req: Request, res: Response) {
    try {
        const query = req.query.q as string;
        const page = parseInt(req.query.page as string || '1', 10);

        if (!query) {
            return res.render('search', {
                query: '',
                results: [],
                page: 1,
                totalPages: 0
            });
        }

        // Search movies
        const { results: movies, totalPages } = await movieService.getMovies({ 
            search: query, 
            page 
        });

        // Filter and sort results
        const allResults = movies
            .filter(item => item.hasStreams)
            .sort((a, b) => {
                // Sort by year (newest first) and then by title
                const yearDiff = parseInt(b.year) - parseInt(a.year);
                if (yearDiff !== 0) return yearDiff;
                return a.title.localeCompare(b.title);
            });

        res.render('search', {
            query,
            results: allResults,
            page,
            totalPages
        });
    } catch (error) {
        console.error('Search error:', error);
        res.render('search', {
            query: req.query.q || '',
            results: [],
            page: 1,
            totalPages: 0
        });
    }
} 