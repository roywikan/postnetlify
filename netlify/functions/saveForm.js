const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // Parse Netlify form submission
    const formData = JSON.parse(event.body);

    const {
      title, slug, tags, category, bodypost, author, imagefile,
      ip, user_agent, referrer, created_at
    } = formData;

    if (!title || !slug || !bodypost) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Construct HTML content
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body>
      <h1>${title}</h1>
      <p><strong>Slug:</strong> ${slug}</p>
      <p><strong>Tags:</strong> ${tags}</p>
      <p><strong>Category:</strong> ${category}</p>
      <div><strong>Content:</strong><p>${bodypost}</p></div>
      <p><strong>Author:</strong> ${author}</p>
      <p><strong>Image:</strong> ${imagefile || 'No Image Uploaded'}</p>
      <p><strong>IP:</strong> ${ip}</p>
      <p><strong>User Agent:</strong> ${user_agent}</p>
      <p><strong>Referrer:</strong> ${referrer}</p>
      <p><strong>Created At:</strong> ${created_at}</p>
    </body>
    </html>
    `;

    // GitHub setup
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const FILE_PATH = `/static/${slug}.html`;

    if (!GITHUB_TOKEN || !REPO) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing environment variables' }),
      };
    }

    const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents${FILE_PATH}`;
    const encodedContent = Buffer.from(htmlContent).toString('base64');

    // Fetch current file SHA
    const fileResponse = await fetch(GITHUB_API_URL, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });

    let sha = null;
    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      sha = fileData.sha; // Use SHA if file exists
    }

    // Save or update the file in GitHub
    const response = await fetch(GITHUB_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        message: `Create/Update post: ${slug}`,
        content: encodedContent,
        sha: sha || undefined,
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
      body: JSON.stringify({ message: 'Form saved successfully', url: result.content.html_url }),
    };
  } catch (error) {
    console.error('Error processing form:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
