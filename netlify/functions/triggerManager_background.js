//Fungsi-fungsi :
  // Fungsi 1: Create static version of the post
  //'https://postnetlify.netlify.app/saveFormsToStatic'
  
  // Fungsi 2: Create static index page files
  //'https://postnetlify.netlify.app/staticIndexMaker'
  
  // Fungsi 3: Update RSS feed
  //'https://postnetlify.netlify.app/rssfeed'
  
  // Fungsi 4: Update sitemap
  //'https://postnetlify.netlify.app/sitemap-xml'



//////////////////////////////////////////

const fetch = require('node-fetch');

exports.handler = async () => {
  const functionUrls = [
    'https://postnetlify.netlify.app/.netlify/functions/saveFormsToStatic',
    'https://postnetlify.netlify.app/.netlify/functions/staticIndexMaker',
    'https://postnetlify.netlify.app/.netlify/functions/rssfeed',
    'https://postnetlify.netlify.app/.netlify/functions/sitemap-xml'
  ];

  try {
    for (let i = 0; i < functionUrls.length; i++) {
      console.log(`Memulai pemanggilan fungsi ${i + 1}: ${functionUrls[i]}`);

      const response = await fetch(functionUrls[i]);
      if (!response.ok) {
        throw new Error(`Fungsi ${i + 1} gagal dengan status ${response.status}`);
      }

      const result = await response.json();
      console.log(`Fungsi ${i + 1} selesai:`, result);
    }

    return {
      statusCode: 200,
      body: 'Semua fungsi berhasil dijalankan secara berurutan dalam background!'
    };
  } catch (error) {
    console.error('Kesalahan saat menjalankan fungsi:', error);
    return {
      statusCode: 500,
      body: `Kesalahan saat menjalankan fungsi: ${error.message}`
    };
  }
};
