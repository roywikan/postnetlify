const fetch = require("node-fetch");

exports.handler = async () => {
  try {
    // Environment variables
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const FILE_PATH = "index-static.html"; // Path untuk file di GitHub root , tidak berlaku untuk multi page index

    const FORM_ID = "673faec750f0a700080c6bac"; // Ganti dengan ID Form Netlify Anda
    const NETLIFY_ENDPOINT = `https://api.netlify.com/api/v1/forms/${FORM_ID}/submissions`;

    const author = "Default Author"; // Atur nilai default jika tidak ada
    const title = "Default Title"; // Atur nilai default jika tidak ada
    const snippet = "Default Snippet";

    let sha = null; // Tambahkan sebelum penggunaan

    if (!NETLIFY_ACCESS_TOKEN || !GITHUB_TOKEN || !REPO) {
      console.error("Missing environment variables:", {
        NETLIFY_ACCESS_TOKEN: !!NETLIFY_ACCESS_TOKEN,
        GITHUB_TOKEN: !!GITHUB_TOKEN,
        REPO: !!REPO,
      });
      throw new Error("Missing required environment variables");
    }

    // Fetch submissions from Netlify Forms
    const netlifyResponse = await fetch(NETLIFY_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (!netlifyResponse.ok) {
      console.error("Netlify API error:", {
        status: netlifyResponse.status,
        statusText: netlifyResponse.statusText,
        url: NETLIFY_ENDPOINT,
      });
      return {
        statusCode: netlifyResponse.status,
        body: JSON.stringify({ error: "Failed to fetch form submissions" }),
      };
    }

    const submissions = await netlifyResponse.json();

    if (!Array.isArray(submissions) || submissions.length === 0) {
      console.warn("Submissions are empty or invalid:", submissions);
      return {
        statusCode: 204,
        body: JSON.stringify({ message: "No submissions found." }),
      };
    }

    const validSubmissions = submissions.filter(submission => submission && submission.data);
    if (validSubmissions.length === 0) {
      console.warn("No valid submissions found");
      return {
        statusCode: 204,
        body: JSON.stringify({ message: "No valid submissions." }),
      };
    }

    const postsPerPage = 5;
    const totalPages = Math.ceil(validSubmissions.length / postsPerPage);

    const cleanText = (text) => {
      if (!text) return "";
      return text
        .replace(/<[^>]*>/g, "") // Hapus semua HTML tags
        .replace(/[^\x20-\x7E]/g, "") // Hapus simbol non-ASCII
        .trim(); // Menghapus spasi berlebih di awal/akhir
    };

    const results = []; // barisbaru: array untuk menyimpan response GitHub

    for (let page = 1; page <= totalPages; page++) {
      const startIndex = (page - 1) * postsPerPage;
      const currentPosts = validSubmissions.slice(startIndex, startIndex + postsPerPage);

      const postListHTML = currentPosts
        .map((submission) => {
          const { title, slug, tags, category, bodypost, author, imagefile } = submission.data;
          const cleanBodyPost = cleanText(bodypost);
          const snippet = cleanBodyPost
            ? cleanBodyPost.split(" ").slice(0, 15).join(" ") + "..."
            : "No description snippet";
          const imageUrl = imagefile?.url || "/350x600xBW.webp";
          return `
            <div class="grid-item">
              <a href="/static/${slug}" style="text-decoration: none; color: inherit;">
                <img src="${imageUrl}" alt="${title}" />
                <h2>${title}</h2>
                <p>${snippet}</p>
              </a>
            </div>`;
        })
        .join("\n");

      const paginationHTML = Array.from({ length: totalPages }, (_, i) => {
        const pageIndex = i + 1;
        const activeClass = pageIndex === page ? "active" : "";
        return `
          <li>
            <a href="/index-static-page${i + 1}.html" class="pagination-button ${activeClass}">
              ${i + 1}
            </a>
          </li>`;
      }).join("\n");

      const templateHTML = `
      <!DOCTYPE html>
      <html lang="en">
        <head></head>
        <body>
          <div id="post-list" class="grid" style="display: flex;">{{POSTS}}</div>
          <div id="pagination" class="pagination" style="display: flex;">
            <ul>${paginationHTML}</ul>
          </div>
        </body>
      </html>`;

      const finalHTML = templateHTML.replace("{{POSTS}}", postListHTML);
      const encodedContent = Buffer.from(finalHTML).toString("base64");
      const filePath = `index-static-page${page}.html`;

      const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${filePath}`;

      const fileResponse = await fetch(GITHUB_API_URL, {
        method: "GET",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        sha = fileData?.sha || null; // Tetap aman jika file belum ada.
      }

      const githubResponse = await fetch(GITHUB_API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          message: `Update ${filePath}`,
          content: encodedContent,
          sha: sha || undefined,
        }),
      });

      results.push(githubResponse); // barisbaru: Tambahkan response ke array results
    }

    for (const res of results) { // barisbaru: Iterasi dan validasi setiap response
      if (!res.ok) {
        const errorDetails = await res.json();
        throw new Error(`Failed to upload page: ${res.statusText}. Details: ${JSON.stringify(errorDetails)}`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "All pages generated successfully" }),
    };
  } catch (error) {
    console.error("Error in combined handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
