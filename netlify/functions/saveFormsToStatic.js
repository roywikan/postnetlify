const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  try {
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    const formId = "673faec750f0a700080c6bac"; // Pastikan formId benar
    const endpoint = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;

    // Fetch submissions dari Netlify
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

    // Pastikan folder /static ada
    const staticPath = path.join(__dirname, "../../static");
    if (!fs.existsSync(staticPath)) {
      fs.mkdirSync(staticPath, { recursive: true }); // Buat folder jika belum ada
    }

    // Tulis tiap submission ke file HTML
    submissions.forEach((submission, index) => {
      const htmlContent = `
        <html>
        <head><title>${submission.data.title}</title></head>
        <body>
          <h1>${submission.data.title}</h1>
          <p>Author: ${submission.data.author}</p>
          <p>Body: ${submission.data.bodypost}</p>
        </body>
        </html>
      `;

      // Simpan file ke folder /static
      fs.writeFileSync(
        path.join(staticPath, `submission-${index + 1}.html`),
        htmlContent,
        "utf8"
      );
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Files created successfully!" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
