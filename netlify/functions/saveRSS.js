const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    const { rss } = JSON.parse(event.body);

    if (!rss) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'RSS content is required' }),
      };
    }

    // Variabel lingkungan dari proses Netlify
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const FILE_PATH = process.env.FILE_PATH_RSS; // Pastikan Anda mendefinisikan FILE_PATH_RSS di variabel lingkungan

    if (!GITHUB_TOKEN || !REPO || !FILE_PATH) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing environment variables' }),
      };
    }

    const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

    // Encode RSS content to Base64
    const encodedContent = Buffer.from(rss).toString('base64');

    // Fetch current file data (untuk mendapatkan SHA jika file sudah ada)
    const fileResponse = await fetch(GITHUB_API_URL, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    let sha = null;
    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      sha = fileData.sha; // Mendapatkan SHA jika file sudah ada
    }

    // Simpan atau perbarui file RSS
    const response = await fetch(GITHUB_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        message: 'Update RSS feed',
        content: encodedContent,
        sha: sha || undefined, // Sertakan SHA hanya jika file sudah ada
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
      body: JSON.stringify({ message: 'RSS feed saved successfully', url: result.content.html_url }),
    };

  } catch (error) {
    console.error('Error in saveRSS function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
