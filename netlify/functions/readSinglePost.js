const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    
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

    // Ensure that slug is extracted from the URL correctly
    const { slug } = event.queryStringParameters; // Extracting slug from query params

    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Slug parameter is missing" }),
      };
    }

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
