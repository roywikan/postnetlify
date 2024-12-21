//Fungsi-fungsi :
  // Fungsi 1: Create static version of the post
  //'https://postnetlify.netlify.app/saveFormsToStatic'
  
  // Fungsi 2: Create static index page files
  //'https://postnetlify.netlify.app/staticIndexMaker'
  
  // Fungsi 3: Update RSS feed 1 page:
  //'https://postnetlify.netlify.app/rssfeed' diberi alternatif baru berupa single proses:
  //https://postnetlify.netlify.app/.netlify/functions/generateRSSfeedXML
  //untuk validasi hasilnya rssfeed.xml tunggu netlify build and publish dulu

  // Fungsi 3a: Update RSS feed multi sub page and 1 index page:
  //https://postnetlify.netlify.app/.netlify/functions/generateRSSfeedXMLperPage

  
  // Fungsi 4: Update sitemap
  //'https://postnetlify.netlify.app/sitemap-xml'

  // Fungsi 4a: Update Site map XML multi sub page and 1 index page:
  //https://postnetlify.netlify.app/.netlify/functions/generateSiteMapXMLperPage


//////////////////////////////////////////

const fetch = require('node-fetch');

exports.handler = async () => {
  const functionUrls = [
    'https://postnetlify.netlify.app/.netlify/functions/saveFormsToStatic',
    'https://postnetlify.netlify.app/.netlify/functions/staticIndexMaker',
    'https://postnetlify.netlify.app/.netlify/functions/generateRSSfeedXMLperPage',
    'https://postnetlify.netlify.app/.netlify/functions/generateSiteMapXMLperPage'
  ];



  try {
    for (let i = 0; i < functionUrls.length; i++) {
      console.log(`Memulai pemanggilan fungsi ${i + 1}: ${functionUrls[i]}`);

      const response = await fetch(functionUrls[i]);
      const contentType = response.headers.get('content-type');

      // Periksa tipe konten respons
      if (contentType.includes('application/json')) {
        const jsonResult = await response.json();
        console.log(`Fungsi ${i + 1} selesai dengan JSON:`, jsonResult);
      } else if (contentType.includes('text/html')) {
        const htmlResult = await response.text();
        console.log(`Fungsi ${i + 1} selesai dengan HTML:\n${htmlResult.substring(0, 200)}...`); // Potong untuk log
      } else if (contentType.includes('text/plain')) {
        const textResult = await response.text();
        console.log(`Fungsi ${i + 1} selesai dengan Text:\n${textResult.substring(0, 200)}...`); // Potong untuk log
      } else {
        throw new Error(`Fungsi ${i + 1} mengembalikan tipe konten yang tidak dikenali: ${contentType}`);
      }
    }

    return {
      statusCode: 200,
      body: 'Semua fungsi berhasil dijalankan secara berurutan!'
    };
  } catch (error) {
    console.error('Kesalahan saat menjalankan fungsi:', error);
    return {
      statusCode: 500,
      body: `Kesalahan saat menjalankan fungsi: ${error.message}`
    };
  }
};
