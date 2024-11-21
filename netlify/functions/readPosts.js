const fetch = require('node-fetch');

exports.handler = async () => {
  const formEntriesEndpoint = `${process.env.NETLIFY_API_URL}/forms?access_token=${process.env.NETLIFY_ACCESS_TOKEN}`;

  try {
    const response = await fetch(formEntriesEndpoint);
    const data = await response.json();
    const posts = data.map(entry => ({
      title: entry.data.title,
      slug: entry.data.slug,
      tags: entry.data.tags,
      category: entry.data.category,
      bodypost: entry.data.bodypost,
      author: entry.data.author,
      imagefile: entry.data.imagefile,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(posts),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error fetching posts' }),
    };
  }
};
