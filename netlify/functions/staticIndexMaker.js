const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  try {
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    const FORM_ID = "673faec750f0a700080c6bac"; // Ganti dengan ID Form Netlify Anda
    const endpoint = `https://api.netlify.com/api/v1/forms/${FORM_ID}/submissions`;

    if (!NETLIFY_ACCESS_TOKEN) {
      throw new Error("NET_TOKEN environment variable is missing");
    }

    // Fetch submissions from Netlify Forms
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Failed to fetch form submissions" }),
      };
    }

    const submissions = await response.json();

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
        const snippet = bodypost ? bodypost.split(" ").slice(0, 15).join(" ") + "..." : "No description";
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

    // Save to file
    const outputPath = path.resolve("./index-static.html");
    fs.writeFileSync(outputPath, finalHTML, "utf8");

    console.log(`File generated: ${outputPath}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "index-static.html generated successfully" }),
    };
  } catch (error) {
    console.error("Error generating static index:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
