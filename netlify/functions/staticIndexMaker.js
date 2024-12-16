const fetch = require("node-fetch");

exports.handler = async () => {
  try {
    // Environment variables
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const FILE_PATH = "index-static.html"; // Path untuk file di GitHub root

    const FORM_ID = "673faec750f0a700080c6bac"; // Ganti dengan ID Form Netlify Anda
    const NETLIFY_ENDPOINT = `https://api.netlify.com/api/v1/forms/${FORM_ID}/submissions`;

    if (!NETLIFY_ACCESS_TOKEN || !GITHUB_TOKEN || !REPO) {
      throw new Error("Missing required environment variables");
    }

    // Fetch submissions from Netlify Forms
    const netlifyResponse = await fetch(NETLIFY_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (!netlifyResponse.ok) {
      return {
        statusCode: netlifyResponse.status,
        body: JSON.stringify({ error: "Failed to fetch form submissions" }),
      };
    }

    const submissions = await netlifyResponse.json();

    // Template HTML
    const templateHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Static Posts</title>
  <link rel="stylesheet" href="/index-html.css">
</head>
<body>
  <header>
    <h1>Posts</h1>
  </header>
  <div id="post-list" class="grid">
    {{POSTS}}
  </div>
  <footer>
    <p>&copy; 2024 Your Blog Name. All Rights Reserved.</p>
  </footer>
</body>
</html>`;

    // Generate post list as HTML
    const postListHTML = submissions
      .map((submission) => {
        const { title, slug, bodypost, imagefile } = submission.data;
        const snippet = bodypost
          ? bodypost.split(" ").slice(0, 15).join(" ") + "..."
          : "No description";
        const imageUrl = imagefile?.url || "/default-image.jpg";

        return `
<div class="grid-item">
  <a href="/post/${slug}" style="text-decoration: none; color: inherit;">
    <img src="${imageUrl}" alt="${title}" />
    <h2>${title}</h2>
    <p>${snippet}</p>
  </a>
</div>`;
      })
      .join("\n");

    // Replace placeholder in template
    const finalHTML = templateHTML.replace("{{POSTS}}", postListHTML);

    // Encode HTML content to Base64 for GitHub API
    const encodedContent = Buffer.from(finalHTML).toString("base64");

    const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

    // Fetch current file data (to get SHA for update)
    const fileResponse = await fetch(GITHUB_API_URL, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    let sha = null;
    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      sha = fileData.sha; // Get SHA if file already exists
    }

    // Save or update file on GitHub
    const githubResponse = await fetch(GITHUB_API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        message: "Update index-static.html",
        content: encodedContent,
        sha: sha || undefined, // Include SHA if file exists
      }),
    });

    if (!githubResponse.ok) {
      const errorDetails = await githubResponse.text();
      return {
        statusCode: githubResponse.status,
        body: JSON.stringify({ error: errorDetails }),
      };
    }

    const result = await githubResponse.json();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "index-static.html generated and saved successfully",
        url: result.content.html_url,
      }),
    };
  } catch (error) {
    console.error("Error in combined handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
