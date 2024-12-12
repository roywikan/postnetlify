const axios = require("axios");

exports.handler = async (event) => {
  const { slug } = event.queryStringParameters;

  if (!slug) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Slug is required" }),
    };
  }

  
  try {
    // Ambil HTML dari URL
    const url = `https://postnetlify.netlify.app/post/${slug}.html`;
    const response = await axios.get(url);
    const htmlContent = response.data;




    
    // Variabel lingkungan diambil dari proses Netlify
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const FILE_PATH = `/static/${slug}.html`; // File path relatif dalam repo

    if (!GITHUB_TOKEN || !REPO) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing environment variables" }),
      };
    }

    const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

    console.log("GitHub API URL:", GITHUB_API_URL);
    console.log("REPO:", process.env.REPO);
    console.log("FILE_PATH:", `static/${slug}.html`);

    // Encode konten HTML ke Base64
    const encodedContent = Buffer.from(htmlContent).toString("base64");

    // Fetch current file data untuk mendapatkan SHA (jika file ada)
    const fileResponse = await axios.get(GITHUB_API_URL, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    let sha = null;
    if (fileResponse.status === 200) {
      sha = fileResponse.data.sha; // Ambil SHA jika file ada
    }

    // Simpan atau perbarui file di GitHub
    const saveResponse = await axios.put(
      GITHUB_API_URL,
      {
        message: `Update ${slug}.html via Netlify Function`,
        content: encodedContent,
        sha: sha || undefined, // Tambahkan SHA jika file ada
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `File ${slug}.html saved successfully to GitHub`,
        url: saveResponse.data.content.html_url,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to save HTML to GitHub",
        details: error.message,
      }),
    };
  }
};
