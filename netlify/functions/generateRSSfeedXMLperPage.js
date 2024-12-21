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

const MAX_POSTS_PER_PAGE = 5; // Maksimal jumlah posting per halaman

exports.handler = async (event) => {
  try {
    // Validasi variabel lingkungan
    if (!NETLIFY_ACCESS_TOKEN || !GITHUB_TOKEN || !REPO || !FILE_PATH) {
      throw new Error('Missing required environment variables');
    }

    // Ambil parameter halaman dari query string (default ke halaman 1 jika tidak ada)
    const { page = 1 } = event.queryStringParameters || {};
    const currentPage = parseInt(page, 10);
    const postsPerPage = 5;

    
    if (isNaN(currentPage) || currentPage < 1) {
      throw new Error('Invalid page parameter');
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
////////////////////////////





    // Pagination logic
    const totalPosts = submissions.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const paginatedSubmissions = submissions.slice(startIndex, startIndex + postsPerPage);

    if (currentPage > totalPages) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Page not found' }),
      };
    }



    ///////////////////


    if (currentPage > totalPages) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Page not found' }),
      };
    }

    // Generate RSS feed content
    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXML(SITE_NAME_TITLE)} - Page ${currentPage}</title>
    <link>https://${SUB_DOMAIN}.${DOMAIN}</link>
    <description>RSS feed for form submissions (Page ${currentPage} of ${totalPages})</description>
    <atom:link href="https://${SUB_DOMAIN}.${DOMAIN}/rssfeed-page-${currentPage}.xml" rel="self" type="application/rss+xml" />

    ${paginatedSubmissions
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

        const postSlug = slug || `post-${startIndex + index + 1}`;
        const postUrl = `https://${SUB_DOMAIN}.${DOMAIN}/${POST_DIR}/${postSlug}.html`;

        return `
        <item>
          <title>${escapeXML(title || `Submission ${startIndex + index + 1}`)}</title>
          <link>${escapeXML(postUrl)}</link>
          <description>${escapeXML(metaDescription)}</description>
          <category>${escapeXML(category || 'Uncategorized')}</category>
          <author>${escapeXML(`${author || 'Master'}@${SUB_DOMAIN}.${DOMAIN} (${author || 'Master'})`)}</author>
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
    const fileName = `rssfeed-page-${currentPage}.xml`; // Dynamic file name for each page
    const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${fileName}`;

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
        message: `Update RSS feed for page ${currentPage}`,
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
        message: `RSS feed saved successfully for page ${currentPage}`,
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


// Membuat file indeks RSS utama
    // Generate Index RSS feed
    const indexContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXML(SITE_NAME_TITLE)} - Index</title>
    <link>https://${SUB_DOMAIN}.${DOMAIN}</link>
    <description>Index for paginated RSS feed</description>
    <atom:link href="https://${SUB_DOMAIN}.${DOMAIN}/rssfeed.xml" rel="self" type="application/rss+xml" />

    ${Array.from({ length: totalPages }, (_, i) => {
      const pageIndex = i + 1;
      const pageUrl = `https://${SUB_DOMAIN}.${DOMAIN}/rssfeed-page-${pageIndex}.xml`;

      return `
      <item>
        <title>${escapeXML(SITE_NAME_TITLE)} - Page ${pageIndex}</title>
        <link>${escapeXML(pageUrl)}</link>
        <description>RSS feed for page ${pageIndex}</description>
        <guid isPermaLink="true">${escapeXML(pageUrl)}</guid>
      </item>`;
    }).join('\n')}
  </channel>
</rss>`;


   // Save RSS feed index ke GitHub
    const indexEncodedContent = Buffer.from(indexContent).toString('base64');
    const INDEX_FILE_PATH = FILE_PATH.replace('rssfeed.xml', 'rssfeed.xml');
    const indexSaveResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${INDEX_FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `token ${GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          message: 'Update RSS feed index',
          content: indexEncodedContent,
          sha: undefined,
        }),
      }
    );

    if (!indexSaveResponse.ok) {
      const errorDetails = await indexSaveResponse.text();
      throw new Error(`Failed to save RSS feed index: ${errorDetails}`);
    }

    // Response saat berhasil
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'RSS index generated successfully' }),
    };
  } catch (error) {
    console.error('Error in handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

