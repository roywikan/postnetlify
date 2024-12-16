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
/*
// debugger Print properti di dalam submission.data
submissions.forEach((submission, index) => {
  console.log(`Submission ${index + 1} keys:`, Object.keys(submission.data));
});

// debugger Print seluruh objek submission
submissions.forEach((submission, index) => {
  console.log(`Submission ${index + 1} full object:`, JSON.stringify(submission, null, 2));
});
*/


    
    // Step 2: Buat direktori sementara di /tmp
    const tmpPath = path.join("/tmp", "static");
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath, { recursive: true });
    }












    
    // Step 3: Tulis file sementara
/*
    // Data level tertinggi
const number = submission.number || null;
const title = submission.title || null;
const email = submission.email || null;
const name = submission.name || null;
const firstName = submission.first_name || null;
const lastName = submission.last_name || null;
const company = submission.company || null;
const summary = submission.summary || null;
const body = submission.body || null;
const createdAt = submission.created_at || null;
const id = submission.id || null;
const formId = submission.form_id || null;
const siteUrl = submission.site_url || null;
const siteName = submission.site_name || null;
const formName = submission.form_name || null;

// Data di dalam submission.data
const dataTitle = submission.data?.title || null;
const slug = submission.data?.slug || null;
const tags = submission.data?.tags || null;
const category = submission.data?.category || null;
const bodyPost = submission.data?.bodypost || null;
const author = submission.data?.author || null;
const imageFile = submission.data?.imagefile || null; // Bisa berupa objek
const imageFileName = submission.data?.imagefile?.filename || null;
const imageFileUrl = submission.data?.imagefile?.url || null;
const ip = submission.data?.ip || null;
const userAgent = submission.data?.user_agent || null;
const referrer = submission.data?.referrer || null;

// Data di dalam submission.human_fields
const humanTitle = submission.human_fields?.Title || null;
const humanSlug = submission.human_fields?.Slug || null;
const humanTags = submission.human_fields?.Tags || null;
const humanCategory = submission.human_fields?.Category || null;
const humanBodyPost = submission.human_fields?.Bodypost || null;
const humanAuthor = submission.human_fields?.Author || null;
const humanImageFile = submission.human_fields?.Imagefile || null;

// Data di dalam submission.ordered_human_fields (array)
const orderedHumanFields = submission.ordered_human_fields || [];
*/
    
    /*
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
    }); */



///////////////////////////////




submissions.forEach((submission, index) => {
  const { 
    title,
    summary,
    slug, 
    tags, 
    category, 
    bodypost, 
    author, 
    imagefile, 
    ip, 
    user_agent, 
    referrer 
  } = submission.data;



    // Properti tambahan dari submission di luar data

  const createdAt = submission.created_at || new Date().toISOString();
  const imageFileName = imagefile?.filename || "No filename";
  const imageFileUrl = imagefile?.url || "No image URL";


  //adaptasi dari post-simplified.html dan post-html-main.js
  //
   const metaDescription = summary ? summary.slice(0, 155) : "No content available"; // First 155 chars
   //const url             = window.location.href;

   // Properti tambahan lainnya

  const pageUrl = referrer || "Unknown"; // Menggunakan referrer sebagai fallback untuk URL halaman
  const safeTitle = title || `Submission ${index + 1}`; 
  //const ogTitle = safeTitle;
  //const twitterTitle = safeTitle; // Sama dengan ogTitle

  

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" id="meta-description" content="${metaDescription || "No description"}">
  <meta name="author" id="meta-author" content="${author || "Unknown"}">

  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${metaDescription || "No description"}">
  <meta property="og:image" content="${imageFileUrl}">
  <meta property="og:url" content="${referrer || "Unknown"}">

  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${metaDescription || "No description"}">
  <meta name="twitter:image" content="${imageFileUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="dns-prefetch" href="https://res.cloudinary.com">

  <title id="page-title">${safeTitle}</title>

  <!-- JSON-LD schema -->
  <script type="application/ld+json" id="json-ld-schema">
  ${JSON.stringify({
    "@context": "http://schema.org",
    "@type": "Article",
    "headline": safeTitle,
    "author": {
      "@type": "Person",
      "name": author || "Unknown"
    },
    "datePublished": createdAt,
    "articleBody": metaDescription || "no article text ",
    "keywords": tags || "",
    "image": imageFileUrl
  }, null, 2)}
  </script>
  <link rel="stylesheet" href="/post-html.css">
  <script src="/post-html-main.js"></script>
</head>
<body>
  <h1>${title || `Submission ${index + 1}`}</h1>
  <p><strong>Author:</strong> ${author || "Unknown"}</p>
  <p><strong>Body:</strong> ${bodypost || "No content"}</p>
  <p><strong>Category:</strong> ${category || "Uncategorized"}</p>
  <p><strong>Tags:</strong> ${tags || "No tags"}</p>
        <hr>
      <p><strong>Image File:</strong></p>
      <ul>
        <li>Filename: ${imageFileName}</li>
        <li>URL: <a href="${imageFileUrl}" target="_blank">${imageFileUrl}</a></li>
      </ul>
  <hr>
  <p><strong>IP:</strong> ${ip || "Unknown"}</p>
  <p><strong>User Agent:</strong> ${user_agent || "Unknown"}</p>
  <p><strong>Referrer:</strong> ${referrer || "Unknown"}</p>
  <p><strong>Created At:</strong> ${new Date(createdAt).toLocaleString() || "Unknown Date"}</p>


      
</body>
</html>
`;

  const fileName = `${submission.data.slug || `submission-${index + 1}`}.html`;
  const filePath = path.join(tmpPath, fileName);

  fs.writeFileSync(filePath, htmlContent, "utf8");
  console.log(`File saved: ${filePath}`);
});


    
//////////////////////////////















    
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
      }, null, 2),
    };
  } catch (error) {
    console.error("Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }, null, 2),









      
    };
  }
};
