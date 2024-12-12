const fs = require("fs");
const path = require("path");
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

    // Tentukan path file di direktori statis
    const filePath = path.join(__dirname, `../static/${slug}.html`);

    // Simpan HTML ke file
    fs.writeFileSync(filePath, htmlContent);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: ` generate-html.js melaporkan File saved as /static/${slug}.html` }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: " generate-html.js melaporkan Failed to fetch or save HTML", details: error.message }),
    };
  }
};
