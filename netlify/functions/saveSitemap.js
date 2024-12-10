const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    const { sitemap } = JSON.parse(event.body);

    if (!sitemap) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Sitemap content is required' }),
      };
    }

    // Variabel lingkungan diambil dari proses Netlify
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const FILE_PATH = process.env.FILE_PATH;

    if (!GITHUB_TOKEN || !REPO || !FILE_PATH) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing environment variables' }),
      };
    }

    const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

    // Encode sitemap content to Base64
    const encodedContent = Buffer.from(sitemap).toString('base64');

    // Fetch current file data (to get the SHA required for updating the file)
    const fileResponse = await fetch(GITHUB_API_URL, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    let sha = null;
    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      sha = fileData.sha; // Get SHA if the file already exists
    }

    // Save or update sitemap file
    const response = await fetch(GITHUB_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        message: 'Update sitemap',
        content: encodedContent,
        sha: sha || undefined, // Only include SHA if file exists
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: errorDetails }),
      };
    }

    const result = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Sitemap saved successfully', url: result.content.html_url }),
    };

  } catch (error) {
    console.error('Error in saveSitemap function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
