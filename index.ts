import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/route";
import rateLimit from "express-rate-limit";
import expressEjsLayouts from "express-ejs-layouts";
import path from "path";
import { movieService } from "./services/movieService";
import { Movie, StreamingLink } from "./types/movie";
import homeController from "./controllers/homeController";
import searchController from "./controllers/searchController";

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layout');
app.use(expressEjsLayouts);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later.",
});

if (process.env.RATE_LIMIT === "true") {
  app.use(limiter);
}

// Add path middleware
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// API Routes
app.use("/api/v1", router);

// Web Routes
app.get("/", homeController);

app.get("/movies", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const search = req.query.search as string;
    const genre = req.query.genre as string;
    const sort = req.query.sort as string || 'popular';

    const { results: movies, totalPages } = await movieService.getMovies({
      page,
      search,
      genre,
      sort
    });

    res.render('movies', {
      movies,
      page,
      totalPages,
      search,
      genre,
      sort
    });
  } catch (error) {
    console.error('Error:', error);
    res.render('movies', {
      movies: [],
      page: 1,
      totalPages: 1,
      search: req.query.search,
      genre: req.query.genre,
      sort: req.query.sort || 'popular'
    });
  }
});

app.get("/movie/:imdbId", async (req: Request, res: Response) => {
  try {
    const { imdbId } = req.params;
    const { movie, streamingLinks, similarMovies } = await movieService.getMovieDetails(imdbId);
    res.render('movie', { movie, streamingLinks, similarMovies });
  } catch (error) {
    console.error('Error:', error);
    res.render('movie', { movie: null, streamingLinks: [], similarMovies: [] });
  }
});

app.get("/search", searchController);

app.get("/category/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string || '1', 10);
    const search = req.query.search as string;
    const sort = req.query.sort as string || 'popular';

    const categories = {
      action: { id: 'action', name: 'Action Movies', genre: 'action' },
      comedy: { id: 'comedy', name: 'Comedy Movies', genre: 'comedy' },
      drama: { id: 'drama', name: 'Drama Movies', genre: 'drama' },
      scifi: { id: 'scifi', name: 'Sci-Fi & Fantasy Movies', genre: 'sci-fi' },
      horror: { id: 'horror', name: 'Horror Movies', genre: 'horror' },
      adventure: { id: 'adventure', name: 'Adventure Movies', genre: 'adventure' },
      animation: { id: 'animation', name: 'Animation Movies', genre: 'animation' },
      crime: { id: 'crime', name: 'Crime Movies', genre: 'crime' },
      documentary: { id: 'documentary', name: 'Documentary Movies', genre: 'documentary' },
      family: { id: 'family', name: 'Family Movies', genre: 'family' }
    };

    const category = categories[id as keyof typeof categories];
    if (!category) {
      return res.redirect('/');
    }

    const { results: movies, totalPages } = await movieService.getMovies({
      page,
      search,
      genre: category.genre,
      sort
    });

    res.render('category', {
      category,
      movies,
      page,
      totalPages,
      search,
      sort
    });
  } catch (error) {
    console.error('Error:', error);
    res.redirect('/');
  }
});

const Port = process.env.PORT || 5001;
app.listen(Port, () => {
  console.log(`Server running on port ${Port}`);
});
