import axios from 'axios';

const BACKUP_DOMAINS = [
  'https://timto329gpl.com',
  'https://d1kn7u0rjh2hf5.cloudfront.net',
  'https://d2p1mzq1c6jx9y.cloudfront.net'
];

export async function getPlayerUrl() {
  try {
    // First try to get from allmovieland.link with timeout
    const res = await axios.get('https://allmovieland.link/player.js?v=60%20128', {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://allmovieland.link'
      }
    });
    
    const resText = res.data;
    const playerUrl = resText.match(/const AwsIndStreamDomain\s*=\s*'([^']+)'/);
    
    if (playerUrl) {
      // Test if the found URL is accessible
      try {
        await axios.get(`${playerUrl[1]}/health`, { timeout: 3000 });
        return playerUrl[1];
      } catch (error) {
        console.error('Primary domain not accessible, trying backup domains');
      }
    }

    // Try backup domains
    for (const domain of BACKUP_DOMAINS) {
      try {
        await axios.get(`${domain}/health`, { timeout: 3000 });
        return domain;
      } catch (error) {
        console.error(`Backup domain ${domain} not accessible`);
        continue;
      }
    }

    // If all else fails, return the first backup domain
    return BACKUP_DOMAINS[0];
  } catch (error) {
    console.error('Error getting player URL:', error);
    // Return the first backup domain if anything fails
    return BACKUP_DOMAINS[0];
  }
} 