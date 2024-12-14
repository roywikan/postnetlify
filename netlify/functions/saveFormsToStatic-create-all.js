const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

exports.handler = async () => {
  try {
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const STATIC_DIR = "static";

    if (!NETLIFY_ACCESS_TOKEN || !GITHUB_TOKEN || !REPO) {
      throw new Error(
        "Environment variables NET_TOKEN, GITHUB_TOKEN, or REPO are missing"
      );
    }

    const formId = "673faec750f0a700080c6bac";
    const endpoint = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;

    // Step 1: Fetch submissions
    const submissions = await fetchSubmissions(endpoint, NETLIFY_ACCESS_TOKEN);

    // Step 2: Write temporary files
    const tmpPath = path.join("/tmp", "static");
    const fileList = writeTempFiles(submissions, tmpPath);

    // Step 3: Upload files to GitHub
    for (const fileName of fileList) {
      const filePath = path.join(tmpPath, fileName);
      await uploadFileToGitHub(REPO, STATIC_DIR, filePath, fileName, GITHUB_TOKEN);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Files uploaded successfully!" }),
    };
  } catch (error) {
    console.error("Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Fetch submissions from Netlify
async function fetchSubmissions(endpoint, token) {
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch form submissions: ${response.statusText}`);
  }

  return response.json();
}

// Write temporary files to /tmp
function writeTempFiles(submissions, tmpPath) {
  if (!fs.existsSync(tmpPath)) {
    fs.mkdirSync(tmpPath, { recursive: true });
  }

  return submissions.map((submission, index) => {
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
    const fileName = `submission-${index + 1}.html`;
    const filePath = path.join(tmpPath, fileName);
    fs.writeFileSync(filePath, htmlContent, "utf8");
    return fileName;
  });
}

// Upload or update file in GitHub
async function uploadFileToGitHub(repo, dir, filePath, fileName, token) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const encodedContent = Buffer.from(fileContent).toString("base64");
  const githubApiUrl = `https://api.github.com/repos/${repo}/contents/${dir}/${fileName}`;

  let sha = null;

  try {
    const { data } = await axios.get(githubApiUrl, {
      headers: { Authorization: `token ${token}` },
    });
    sha = data.sha;

    // Compare content to avoid unnecessary updates
    const existingContent = Buffer.from(data.content, "base64").toString("utf8");
    if (existingContent === fileContent) {
      console.log(`${fileName} is already up-to-date. Skipping upload.`);
      return;
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      throw new Error(`Error checking file: ${error.message}`);
    }
    console.log(`${fileName} does not exist. Creating a new file.`);
  }

  // Upload or update file
  await axios.put(
    githubApiUrl,
    {
      message: `Create/Update ${fileName}`,
      content: encodedContent,
      sha: sha || undefined,
    },
    { headers: { Authorization: `token ${token}` } }
  );

  console.log(`${fileName} uploaded successfully.`);
}
