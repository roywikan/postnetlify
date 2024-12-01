const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
     //NET_TOKEN  //nfp_J9noW6zg8YM1XFrUJF1Sa3DYUrbaoJvB8b90

    if (!NETLIFY_ACCESS_TOKEN) {
      throw new Error("NET_TOKEN environment variable is missing");
    }

    const formId = "673faec750f0a700080c6bac";
    const endpoint = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;

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

    // Get slug from the query string
    const { slug } = event.queryStringParameters;
    
    // Find the post with the matching slug
    const post = submissions.find(submission => submission.data.slug === slug);

    if (!post) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Post with slug '${slug}' not found.` }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(post),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

