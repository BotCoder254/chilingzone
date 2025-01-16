# ChilingZone 🎬

<div align="center">

<img src="public/images/logo.svg" alt="ChilingZone Logo" width="200"/>

[![GitHub stars](https://img.shields.io/github/stars/BotCoder254/ChilingZone?style=for-the-badge)](https://github.com/BotCoder254/ChilingZone/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/BotCoder254/ChilingZone?style=for-the-badge)](https://github.com/BotCoder254/ChilingZone/network)
[![GitHub issues](https://img.shields.io/github/issues/BotCoder254/ChilingZone?style=for-the-badge)](https://github.com/BotCoder254/ChilingZone/issues)
[![GitHub license](https://img.shields.io/github/license/BotCoder254/ChilingZone?style=for-the-badge)](https://github.com/BotCoder254/ChilingZone/blob/main/LICENSE)

<!-- [![GitHub Activity](https://activity-graph.herokuapp.com/graph?username=BotCoder254&theme=react-dark&hide_border=true)](https://github.com/BotCoder254) -->

[![GitHub Streak](https://github-readme-streak-stats.herokuapp.com/?user=BotCoder254&theme=dark)](https://github.com/BotCoder254)

🎥 A modern streaming platform that provides Movies streaming links by IMDB IDs.

[View Demo](https://chilingzone.vercel.app) · [Report Bug](https://github.com/BotCoder254/ChilingZone/issues) · [Request Feature](https://github.com/BotCoder254/ChilingZone/issues)

</div>

## ✨ Features

- 🎬 Stream Movies in Multiple Languages
- 🌐 Support for Multiple Video Qualities
- 🎯 Advanced Search Functionality
- 📱 Responsive Design
- 🚀 Fast Loading Times
- 🎨 Modern UI/UX
- 🔍 IMDB Integration
- 📺 HLS Stream Support

<!-- ## 🎯 Screenshots

<div align="center">
<img src="screenshots/home.png" alt="Home Page" width="400"/>
<img src="screenshots/movie.png" alt="Movie Page" width="400"/>
<img src="screenshots/search.png" alt="Search Page" width="400"/>
<img src="screenshots/category.png" alt="Category Page" width="400"/>
</div> -->

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Docker (optional)

### Installation

1. Clone the repository
```bash
git clone https://github.com/BotCoder254/ChilingZone.git
```

2. Install dependencies
```bash
cd ChilingZone
npm install
```

3. Build and start the application
```bash
npm run build
npm run start
```

### Docker Installation

```bash
# Build the image
docker build -t movieflix .

# Run the container
docker run -p 3000:3000 -it -d movieflix
```

## 📖 API Documentation

### Get Media Info
Provides information file and key for streaming.

**Endpoint**: `/api/v1/mediaInfo?id=tt1877830`

**Response**:
```json
{
    "success": true,
    "data": {
        "playlist": [
            {
                "title": "Hindi",
                "id": "24b8c045e7fcd28fb2ee654de75a5771",
                "file": "..."
            },
            {
                "title": "English",
                "id": "fd93fd0a7fc57f1e0c9c54110322a05f",
                "file": "..."
            }
        ],
        "key": "..."
    }
}
```

### Get Stream
Provides the streaming link.

**Endpoint**: `/api/v1/getStream`
**Method**: POST

**Example**:
```javascript
fetch('/api/v1/getStream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        file: '~8i-Mu-WONoEdJ9whQe+Ldow...',
        key: 'rcbeUV3KoCw-dSFJ-vN$-JwI4OXlCmOaAx05HkWyclbx46SNcazmpYmnFTXoNjo'
    })
})
```

## 🌟 Deployment

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBotCoder254%2FChilingZone)

### Deploy to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/BotCoder254/ChilingZone)

## 📊 Project Stats

<div align="center">

[![Contributors](https://img.shields.io/github/contributors/BotCoder254/ChilingZone?style=for-the-badge)](https://github.com/BotCoder254/ChilingZone/graphs/contributors)
[![Last Commit](https://img.shields.io/github/last-commit/BotCoder254/ChilingZone?style=for-the-badge)](https://github.com/BotCoder254/ChilingZone/commits/main)
[![Repo Size](https://img.shields.io/github/repo-size/BotCoder254/ChilingZone?style=for-the-badge)](https://github.com/BotCoder254/ChilingZone)
[![Code Size](https://img.shields.io/github/languages/code-size/BotCoder254/ChilingZone?style=for-the-badge)](https://github.com/BotCoder254/ChilingZone)

[![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=BotCoder254&layout=compact&theme=dark)](https://github.com/BotCoder254)

</div>

## 👥 Contributors

<div align="center">
<a href="https://github.com/BotCoder254">
  <img src="https://github.com/BotCoder254.png" width="100px" alt="BotCoder254" style="border-radius: 50%;"/>
</a>
<a href="https://github.com/SamuelDevp">
  <img src="https://github.com/SamuelDevp.png" width="100px" alt="SamuelDevp" style="border-radius: 50%;"/>
</a>

**Developed by [@BotCoder254](https://github.com/BotCoder254)**  
**Contributed by [@SamuelDevp](https://github.com/SamuelDevp)**

</div>

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for movie data
- [HLS.js](https://github.com/video-dev/hls.js/) for video streaming
- All contributors who helped make this project better

<div align="center">

Made with ❤️ by [BotCoder254](https://github.com/BotCoder254) & [SamuelDevp](https://github.com/SamuelDevp)

</div>