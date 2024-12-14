const fetch = require('node-fetch');
const fs = require('fs').promises;

exports.handler = async (event) => {
  try {
    // Cek metode HTTP, hanya tanggapi GET untuk pemicu manual
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed. Use GET instead.' }),
      };
    }

    // Ambil form submissions dari Netlify API
    const NETLIFY_API = 'https://api.netlify.com/api/v1/forms';
    const NETLIFY_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

    if (!NETLIFY_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing Netlify Access Token' }),
      };
    }

    // Fetch daftar form dari Netlify
    const formResponse = await fetch(NETLIFY_API, {
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
      },
    });

    if (!formResponse.ok) {
      return {
        statusCode: formResponse.status,
        body: JSON.stringify({ error: 'Failed to fetch Netlify forms.' }),
      };
    }

    const forms = await formResponse.json();
    const postForm = forms.find((form) => form.name === 'postForm');

    if (!postForm) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Form postForm not found.' }),
      };
    }

    // Fetch semua submission untuk form postForm
    const submissionsResponse = await fetch(
      `${NETLIFY_API}/${postForm.id}/submissions`,
      {
        headers: {
          Authorization: `Bearer ${NETLIFY_TOKEN}`,
        },
      }
    );

    if (!submissionsResponse.ok) {
      return {
        statusCode: submissionsResponse.status,
        body: JSON.stringify({ error: 'Failed to fetch form submissions.' }),
      };
    }

    const submissions = await submissionsResponse.json();

    // Simpan setiap submission sebagai file HTML
    for (const submission of submissions) {
      const {
        title,
        slug,
        tags,
        category,
        bodypost,
        author,
        imagefile,
        ip,
        user_agent,
        referrer,
        created_at,
      } = submission.data;

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body>
          <h1>${title}</h1>
          <p><strong>Slug:</strong> ${slug}</p>
          <p><strong>Tags:</strong> ${tags}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Body:</strong></p>
          <div>${bodypost}</div>
          <p><strong>Author:</strong> ${author}</p>
          <p><strong>Image File:</strong> ${imagefile}</p>
          <p><strong>IP Address:</strong> ${ip}</p>
          <p><strong>User Agent:</strong> ${user_agent}</p>
          <p><strong>Referrer:</strong> ${referrer}</p>
          <p><strong>Created At:</strong> ${created_at}</p>
        </body>
        </html>
      `;

      const filePath = `./static/${slug || 'submission'}-${submission.id}.html`;
      await fs.writeFile(filePath, htmlContent, 'utf8');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Static HTML files created successfully!',
        filesCount: submissions.length,
      }),
    };
  } catch (error) {
    console.error('Error in saveFormsToStatic:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
