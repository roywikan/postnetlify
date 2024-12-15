const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

exports.handler = async (event) => {
  try {
    // Ambil environment variables
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const STATIC_DIR = "static"; // Direktori target di GitHub

    // Ambil nilai RECREATE dari query parameter
    const params = new URLSearchParams(event.queryStringParameters);
    const RECREATE = params.get('RECREATE') === 'true';

    if (!NETLIFY_ACCESS_TOKEN || !GITHUB_TOKEN || !REPO) {
      throw new Error(
        "Environment variables NET_TOKEN, GITHUB_TOKEN, or REPO are missing"
      );
    }

    const formId = "673faec750f0a700080c6bac";
    const endpoint = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;

    // Step 1: Fetch submissions dari Netlify
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

    // Step 2: Buat direktori sementara di /tmp
    const tmpPath = path.join("/tmp", "static");
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath, { recursive: true });
    }

    // Step 3: Tulis file sementara
    submissions.forEach((submission, index) => {
      const slug = submission.data.slug || `submission-${index + 1}`; // Gunakan slug jika ada, fallback ke nama default
      const htmlContent = `
        <html>
        <head><title>${submission.data.title || `Submission ${index + 1}`}</title></head>
        <body>
          <h1>${submission.data.title || `Submission ${index + 1}`}</h1>
          <p>Author: ${submission.data.author || "Unknown"}</p>
          <p>Body: ${submission.data.bodypost || "No content"}</p>
        </body>
        </html>
      `;
      const filePath = path.join(tmpPath, `${slug}.html`); // Nama file berdasarkan slug
      fs.writeFileSync(filePath, htmlContent, "utf8");
    });

    // Step 4: Upload file ke GitHub
    const fileList = fs.readdirSync(tmpPath);
    const report = []; // Array untuk menyimpan laporan status file

    for (const fileName of fileList) {
      const filePath = path.join(tmpPath, fileName);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const encodedContent = Buffer.from(fileContent).toString("base64");

      const githubApiUrl = `https://api.github.com/repos/${REPO}/contents/${STATIC_DIR}/${fileName}`;

      // Check if file already exists
      let sha = null;

      try {
        const fileCheckResponse = await axios.get(githubApiUrl, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        });
        sha = fileCheckResponse.data.sha;

        // Jika RECREATE adalah false, hanya update jika konten berbeda
        if (!RECREATE) {
          const existingContent = fileCheckResponse.data.content;
          const decodedContent = Buffer.from(existingContent, "base64").toString("utf8");
          if (decodedContent === fileContent) {
            console.log(`${fileName} is already up-to-date. Skipping upload.`);
            report.push({ file: fileName, status: "skipped" });
            continue;
          }
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`${fileName} does not exist, creating a new file.`);
        } else {
          throw new Error(`Error checking file: ${error.message}`);
        }
      }

      // Upload or update the file
      await axios.put(
        githubApiUrl,
        {
          message: `Create/Update ${fileName}`,
          content: encodedContent,
          sha: sha || undefined, // Sertakan SHA jika file ada
        },
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );

      console.log(`${fileName} uploaded successfully.`);
      report.push({ file: fileName, status: sha ? "updated" : "created" });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Files uploaded successfully to GitHub!",
        report: report,
      }),
    };
  } catch (error) {
    console.error("Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
