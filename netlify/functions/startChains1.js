//Fungsi-fungsi :
  // Fungsi 1: Create static version of the post
  'https://postnetlify.netlify.app/saveFormsToStatic')
  
  // Fungsi 3: Create static index page files
  'https://postnetlify.netlify.app/staticIndexMaker'
  
  // Fungsi 5: Update RSS feed
  'https://postnetlify.netlify.app/rssfeed'
  
  // Fungsi 7: Update sitemap
  'https://postnetlify.netlify.app/sitemap-xml'



//////////////////////////////////////////

const fetch = require('node-fetch');

exports.handler = async () => {
  try {
    // Simulasi proses fungsi 1
    console.log('Fungsi 1 sedang diproses...saveFormsToStatic');
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulasi proses 5 detik

    // Memicu Fungsi 2
    const response = await fetch('https://postnetlify.netlify.app/saveFormsToStatic');
    const result = await response.json();

    console.log('Fungsi 1 saveFormsToStatic selesai, memicu Fungsi 2 staticIndexMaker:', result);

    return {
      statusCode: 200,
      body: 'Fungsi 1 saveFormsToStatic selesai!',
    };
  } catch (error) {
    console.error('Fungsi 1 saveFormsToStatic gagal:', error);
    return {
      statusCode: 500,
      body: 'Fungsi 1 saveFormsToStatic gagal.',
    };
  }
};
