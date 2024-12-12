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
    //const filePath = path.join(__dirname, `../static/${slug}.html`);
    //const filePath = path.join(process.env.LAMBDA_TASK_ROOT, `../public/static/${slug}.html`);

       // Tentukan path direktori dan file di root deploy
    const staticDir = path.join(process.cwd(), "public/static");

    // Pastikan direktori target ada
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }

    const filePath = path.join(staticDir, `${slug}.html`);

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

//JIKA {"error":" generate-html.js melaporkan Failed to fetch or save HTML","details":"ENOENT: no such file or directory, open '/var/task/static/saving-a-payload-to-a-file-in-a-github-repo-using-netlify-function-and-github-api-549.html'"} maka itu berarti masalah relative path ke static directory
