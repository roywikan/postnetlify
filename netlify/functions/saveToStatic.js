const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  const slug = event.path.split('/').pop(); // Mendapatkan slug dari URL
  const fileName = `${slug}.html`;
  const staticDir = path.join(__dirname, '../../static');

  // Data dinamis (contoh data, ganti dengan fetch atau query sesuai kebutuhan)
  const dynamicContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${slug}</title>
    </head>
    <body>
      <header>
        <h1>${slug}</h1>
      </header>
      <main>
        <p>Ini adalah konten untuk ${slug}.</p>
      </main>
    </body>
    </html>
  `;

  try {
    // Buat direktori static jika belum ada
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }

    // Simpan file HTML ke direktori static
    fs.writeFileSync(path.join(staticDir, fileName), dynamicContent, 'utf8');

    return {
      statusCode: 200,
      body: `File ${fileName} berhasil dibuat dan disimpan di /static/`,
    };
  } catch (error) {
    console.error('Error saving file:', error);

    return {
      statusCode: 500,
      body: 'Terjadi kesalahan saat menyimpan file.',
    };
  }
};
