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
    const RECREATE = params.get('RECREATE') === 'true' ? true : false;

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
    console.log("Raw API Response:", submissions);




    

    // Step 2: Buat direktori sementara di /tmp
    const tmpPath = path.join("/tmp", "static");
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath, { recursive: true });
    }


    //template file diletakkan di : https://github.com/roywikan/postnetlify/blob/main/netlify/functions/static-post-template.html
    // atau di https://postnetlify.netlify.app/.netlify/functions/static-post-template.html
    // Step 3: Tulis file sementara

//const axios = require("axios");
//const fs = require("fs");
//const path = require("path");

const templateURL = "https://raw.githubusercontent.com/roywikan/postnetlify/main/netlify/functions/static-post-template.html";

exports.handler = async (event) => {
  try {
    console.log("Fetching template from:", templateURL);
    
    // Fetch the template from the external URL
    const getTemplateFromURL = async () => {
      const response = await axios.get(templateURL);
      return response.data;
    };

    const template = await getTemplateFromURL();
    console.log("Template fetched successfully.");



    console.log("Submissions loaded:", submissions);

    if (!submissions || submissions.length === 0) {
      console.log("No submissions found!");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No submissions found!" }),
      };
    }

    // Temporary directory for writing files
    const tmpPath = path.join("/tmp", "static");
    console.log("Temporary directory:", tmpPath);

    if (!fs.existsSync(tmpPath)) {
      console.log("Creating temporary directory...");
      fs.mkdirSync(tmpPath, { recursive: true });
    }

    // Initialize log object
    const logData = [];

    // Step 3: Process and write files
    submissions.forEach((submission, index) => {
      const slug = submission.data.slug || `submission-${index + 1}`;
      const htmlContent = template
        .replace("{{title}}", submission.data.title || `Submission ${index + 1}`)
        .replace("{{author}}", submission.data.author || "Unknown")
        .replace("{{body}}", submission.data.bodypost || "No content");

      const filePath = path.join(tmpPath, `${slug}.html`);
      console.log(`Creating file at: ${filePath}`);
      
      fs.writeFileSync(filePath, htmlContent, "utf8");

      // Add log entry
      logData.push({
        index,
        slug,
        filePath,
        title: submission.data.title || `Submission ${index + 1}`,
        status: "Created",
      });
    });

    console.log("All files created successfully:", logData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Files created successfully!",
        files: logData,
      }),
    };
  } catch (error) {
    console.error("Error occurred:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};



    // Step 4: Upload file ke GitHub
    const fileList = fs.readdirSync(tmpPath);

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
            continue;
          }
        } else {
          console.log(`${fileName} does not exist or RECREATE is set to true, creating/updating file.`);
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
    }

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
