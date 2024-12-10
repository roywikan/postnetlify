const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { REPO, FILE_PATH, BRANCH } = {
    REPO: 'roywikan/postnetlify', // Ganti dengan user/repo Anda
    FILE_PATH: 'sitemap.xml', // File yang akan disimpan
    BRANCH: 'main', // Branch Anda
  };

  const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
  const TOKEN = process.env.GITHUB_TOKEN;

  if (!TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing GitHub token in environment variables.' }),
    };
  }

  try {
    // Cek apakah file sudah ada
    const fileResponse = await fetch(GITHUB_API_URL, {
      headers: { Authorization: `token ${TOKEN}` },
    });

    let sha = null;
    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      sha = fileData.sha; // Dapatkan SHA file untuk update
    }

    // Data untuk sitemap
    const { sitemap } = JSON.parse(event.body); // Mendapatkan sitemap dari request body
    const content = Buffer.from(sitemap).toString('base64'); // Encode content ke Base64

    // Kirim request untuk menyimpan file
    const response = await fetch(GITHUB_API_URL, {
      method: 'PUT',
      headers: {
        Authorization: `token ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Update sitemap.xml',
        content: content,
        branch: BRANCH,
        sha: sha, // SHA jika file sudah ada
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Sitemap saved to GitHub!' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
