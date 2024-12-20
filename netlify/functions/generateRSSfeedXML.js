// Variabel lingkungan dari proses Netlify
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.REPO;
const FILE_PATH = process.env.RSS_FILE_PATH; // Pastikan Anda mendefinisikan FILE_PATH_RSS di variabel lingkungan
const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
const SUB_DOMAIN = 'postnetlify';
const DOMAIN = 'netlify.app';
const SITE_NAME_TITLE = 'POSTS';
const POST_DIR = 'static';

// hasil akhir slug harus seperti ini: https://postnetlify.netlify.app/static/post-slug-blah.html


const formatRFC822 = (date) => {
  return new Date(date).toUTCString(); // Mengubah tanggal menjadi format RFC-822
};




exports.handler = async (event) => {
  try {
    //if (event.httpMethod !== 'POST') {
      //return {
        //statusCode: 405,
        //body: JSON.stringify({ error: 'Method Not Allowed' }),
      //};
    //}

    // Validasi Variabel Lingkungan
    if (!NETLIFY_ACCESS_TOKEN || !GITHUB_TOKEN || !REPO || !FILE_PATH) {
      throw new Error('Missing required environment variables');
    }

    // Fetch submissions from Netlify Forms
    const formId = '673faec750f0a700080c6bac';
    const endpoint = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;
    const formResponse = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (!formResponse.ok) {
      throw new Error(`Failed to fetch form submissions: ${formResponse.statusText}`);
    }

    const submissions = await formResponse.json();

    // Fungsi utilitas
    const escapeXML = (str) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const cleanText = (text) => {
      if (!text) return '';
      return text
        .replace(/<[^>]*>/g, '') // Hapus tag HTML
        .replace(/[^\x20-\x7E]/g, ''); // Hapus simbol non-ASCII
    };

    const truncateToWords = (text, maxLength) => {
      if (!text) return '';
      const words = text.split(/\s+/);
      let truncated = '';
      for (const word of words) {
        if ((truncated + word).length > maxLength) break;
        truncated += (truncated ? ' ' : '') + word;
      }
      return truncated;
    };

    // Membuat RSS feed
    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXML(SITE_NAME_TITLE)}</title>
    <link>https://${SUB_DOMAIN}.${DOMAIN}</link>
    <description>RSS feed for form submissions</description>
    ${submissions
      .map((submission, index) => {
        const {
          title,
          slug,
          tags,
          category,
          bodypost,
          author,
          imagefile,
          ip,
        } = submission.data;

        const createdAt = submission.created_at || new Date().toISOString();
        const imageFileUrl = imagefile?.url || 'No image URL';
        const cleanedBody = cleanText(bodypost);
        const metaDescription = truncateToWords(cleanedBody, 155) || 'No bodypost content available';

        const postSlug = slug || `post-${index + 1}`;
        const postUrl = `https://${SUB_DOMAIN}.${DOMAIN}/${POST_DIR}/${postSlug}.html`;



        return `
        <item>
          <title>${escapeXML(title || `Submission ${index + 1}`)}</title>
          <link>${escapeXML(postUrl)}</link>
          <description>${escapeXML(metaDescription)}</description>
          <category>${escapeXML(category || 'Uncategorized')}</category>
          <author>${escapeXML(author ? author + `@${SUB_DOMAIN}.${DOMAIN}` : `Master@${SUB_DOMAIN}.${DOMAIN}`)}</author>
          <pubDate>${formatRFC822(createdAt)}</pubDate>
          <guid isPermaLink="true">${escapeXML(postUrl)}</guid>
          <media:content url="${escapeXML(imageFileUrl)}" />
        </item>`;
      })
      .join('\n')}
  </channel>
</rss>`;

    // Encode content for GitHub API
    const encodedContent = Buffer.from(rssContent).toString('base64');
    const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

    // Check if the file exists on GitHub
    let sha = null;
    const fileResponse = await fetch(GITHUB_API_URL, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });

    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      sha = fileData.sha;
    }

    // Save updated RSS feed to GitHub
    const saveResponse = await fetch(GITHUB_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        message: 'Update RSS feed',
        content: encodedContent,
        sha: sha || undefined,
      }),
    });

    if (!saveResponse.ok) {
      const errorDetails = await saveResponse.text();
      throw new Error(`Failed to save RSS feed: ${errorDetails}`);
    }

    const result = await saveResponse.json();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'RSS feed saved successfully',
        url: result.content.html_url,
      }),
    };
  } catch (error) {
    console.error('Error in handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
