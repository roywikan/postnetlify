const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Step 1: Create static version of the post
  await fetch('https://postnetlify.netlify.app/saveFormsToStatic');
  
  // Step 2: Wait for 4 minutes
  await new Promise(resolve => setTimeout(resolve, 240000));

  // Step 3: Create static index page files
  await fetch('https://postnetlify.netlify.app/staticIndexMaker');
  
  // Step 4: Wait for 3 minutes
  await new Promise(resolve => setTimeout(resolve, 180000));

  // Step 5: Update RSS feed
  await fetch('https://postnetlify.netlify.app/rssfeed');
  
  // Step 6: Wait for 1 minute
  await new Promise(resolve => setTimeout(resolve, 60000));

  // Step 7: Update sitemap
  await fetch('https://postnetlify.netlify.app/sitemap-xml');
  
  // Step 8: Wait for 1 minute
  await new Promise(resolve => setTimeout(resolve, 60000));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Automation completed successfully.' })
  };
};
