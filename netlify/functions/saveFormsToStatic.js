const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

exports.handler = async () => {
  try {
    // Ambil environment variables
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const STATIC_DIR = "static"; // Direktori target di GitHub

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
      const filePath = path.join(tmpPath, `submission-${index + 1}.html`);
      fs.writeFileSync(filePath, htmlContent, "utf8");
    });

    // Step 4: Upload file ke GitHub
    const fileList = fs.readdirSync(tmpPath);
    const uploadPromises = fileList.map(async (fileName) => {
      const filePath = path.join(tmpPath, fileName);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const encodedContent = Buffer.from(fileContent).toString("base64");

      const githubApiUrl = `https://api.github.com/repos/${REPO}/contents/${STATIC_DIR}/${fileName}`;

      // Cek apakah file sudah ada untuk mendapatkan SHA
      let sha = null;
      try {
        const fileCheckResponse = await axios.get(githubApiUrl, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        });
        sha = fileCheckResponse.data.sha; // Dapatkan SHA jika file sudah ada
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`${fileName} does not exist, creating a new file.`);
        } else {
          throw new Error(`Error checking file: ${error.message}`);
        }
      }

      // Upload file ke GitHub
      try {
        const uploadResponse = await axios.put(
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
        console.log(`File ${fileName} uploaded successfully!`);
        return uploadResponse.data;
      } catch (uploadError) {
        console.error(`Failed to upload ${fileName}: ${uploadError.message}`);
        throw uploadError;
      }
    });

    // Tunggu semua file selesai diupload
    await Promise.all(uploadPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Files uploaded successfully to GitHub!",
        files: fileList,
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
