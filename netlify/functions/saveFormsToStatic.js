const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

exports.handler = async (event) => {
  try {
    // Ambil environment variables
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const STATIC_DIR = "static"; // Direktori target di GitHub

    // Ambil nilai RECREATE dari query parameter
    const params = new URLSearchParams(event.queryStringParameters);
    const RECREATE = params.get('RECREATE') === 'true';

    if (!NETLIFY_ACCESS_TOKEN || !GITHUB_TOKEN || !REPO) {
      throw new Error(
        "Environment variables NET_TOKEN, GITHUB_TOKEN, or REPO are missing"
      );
    }

    const formId = "673faec750f0a700080c6bac";
    const endpoint = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;

    // Step 1: Fetch submissions dari Netlify
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
/*
// debugger Print properti di dalam submission.data
submissions.forEach((submission, index) => {
  console.log(`Submission ${index + 1} keys:`, Object.keys(submission.data));
});

// debugger Print seluruh objek submission
submissions.forEach((submission, index) => {
  console.log(`Submission ${index + 1} full object:`, JSON.stringify(submission, null, 2));
});
*/


    
    // Step 2: Buat direktori sementara di /tmp
    const tmpPath = path.join("/tmp", "static");
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath, { recursive: true });
    }












    
    // Step 3: Tulis file sementara
/*
    // Data level tertinggi
const number = submission.number || null;
const title = submission.title || null;
const email = submission.email || null;
const name = submission.name || null;
const firstName = submission.first_name || null;
const lastName = submission.last_name || null;
const company = submission.company || null;
const summary = submission.summary || null;
const body = submission.body || null;
const createdAt = submission.created_at || null;
const id = submission.id || null;
const formId = submission.form_id || null;
const siteUrl = submission.site_url || null;
const siteName = submission.site_name || null;
const formName = submission.form_name || null;

// Data di dalam submission.data
const dataTitle = submission.data?.title || null;
const slug = submission.data?.slug || null;
const tags = submission.data?.tags || null;
const category = submission.data?.category || null;
const bodyPost = submission.data?.bodypost || null;
const author = submission.data?.author || null;
const imageFile = submission.data?.imagefile || null; // Bisa berupa objek
const imageFileName = submission.data?.imagefile?.filename || null;
const imageFileUrl = submission.data?.imagefile?.url || null;
const ip = submission.data?.ip || null;
const userAgent = submission.data?.user_agent || null;
const referrer = submission.data?.referrer || null;

// Data di dalam submission.human_fields
const humanTitle = submission.human_fields?.Title || null;
const humanSlug = submission.human_fields?.Slug || null;
const humanTags = submission.human_fields?.Tags || null;
const humanCategory = submission.human_fields?.Category || null;
const humanBodyPost = submission.human_fields?.Bodypost || null;
const humanAuthor = submission.human_fields?.Author || null;
const humanImageFile = submission.human_fields?.Imagefile || null;

// Data di dalam submission.ordered_human_fields (array)
const orderedHumanFields = submission.ordered_human_fields || [];
*/
    
    /*
    submissions.forEach((submission, index) => {
      const slug = submission.data.slug || `submission-${index + 1}`; // Gunakan slug jika ada, fallback ke nama default
      const htmlContent = `
        <html>
        <head><title>${submission.data.title || `Submission ${index + 1}`}</title></head>
        <body>
          <h1>${submission.data.title || `Submission ${index + 1}`}</h1>
          <p>Author: ${submission.data.author || "Unknown"}</p>
          <p>Body: ${submission.data.bodypost || "No content"}</p>
        </body>
        </html>
      `;
      const filePath = path.join(tmpPath, `${slug}.html`); // Nama file berdasarkan slug
      fs.writeFileSync(filePath, htmlContent, "utf8");
    }); */



///////////////////////////////




submissions.forEach((submission, index) => {
  const { 
    title,
    slug, 
    tags, 
    category, 
    bodypost, 
    author, 
    imagefile, 
    ip, 
    user_agent, 
    referrer 
  } = submission.data;






    // Properti tambahan dari submission di luar data

  const createdAt = submission.created_at || new Date().toISOString();

  const imageFileUrl = imagefile?.url || "No image URL";


  //adaptasi dari post-simplified.html dan post-html-main.js
  //
  // Fungsi untuk membersihkan bodypost
  const cleanText = (text) => {
    if (!text) return "";
    return text
      .replace(/<[^>]*>/g, "") // Hapus semua HTML tags
      .replace(/[^\x20-\x7E]/g, ""); // Hapus semua simbol non-ASCII
  };

  const cleanedBody = cleanText(bodypost); // Membersihkan bodypost
  //const metaDescription = cleanedBody ? cleanedBody.slice(0, 155) : "No bodypost content available"; // First 155 chars

  const truncateToWords = (text, maxLength) => {
  if (!text) return "";
  
  const words = text.split(/\s+/); // Pecah teks berdasarkan spasi
  let truncated = "";
  
  for (const word of words) {
    if ((truncated + word).length > maxLength) break;
    truncated += (truncated ? " " : "") + word;
  }

  return truncated;
};

// Menghasilkan metaDescription dengan batas 155 karakter
const metaDescription = truncateToWords(cleanedBody, 155) || "No bodypost content available";


   //const url             = window.location.href;

   // Properti tambahan lainnya
  //const pageUrl = referrer || "Unknown"; // Menggunakan referrer sebagai fallback untuk URL halaman
  const safeTitle = title || `Submission ${index + 1}`; 
  const imageFileName = safeTitle || metaDescription;


  

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" id="meta-description" content="${metaDescription || "No meta description"}">
  <meta name="author" id="meta-author" content="${author || "Unknown"}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${metaDescription || "No og description"}">
  <meta property="og:image" content="${imageFileUrl}">
  <meta property="og:url" content="${referrer || "Unknown"}">

  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${metaDescription || "No twitter description"}">
  <meta name="twitter:image" content="${imageFileUrl}">
  <meta name="twitter:card" content="summary_large_image">
  
  <link rel="dns-prefetch" href="https://res.cloudinary.com">
  <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/rss.xml">
  <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml">

  <title id="page-title">${safeTitle}</title>

  <!-- JSON-LD schema -->
  <script type="application/ld+json" id="json-ld-schema">
  ${JSON.stringify({
    "@context": "http://schema.org",
    "@type": "Article",
    "headline": safeTitle,
    "author": {
      "@type": "Person",
      "name": author || "Unknown"
    },
    "datePublished": createdAt,
    "articleBody": metaDescription || "no article body text ",
    "keywords": tags || "",
    "image": imageFileUrl
  }, null, 2)}
  </script>
  <link rel="stylesheet" href="/post-html.css">
  <script src="/post-html-main.js"></script>
</head>
<body>

  <div class="container" style="min-height: 1300px;"  itemscope itemtype="http://schema.org/Article" >
    <header>
      <nav class="menu">
        <a href="/">Home</a> | 
        <a href="#search_input" onclick="focusSearchInput()">Search</a>
      </nav>
  
      <!-- Post Title -->
        <h1 class="post-title" style="" itemprop="headline">
          <span id="post-title">${safeTitle}</span>
        </h1>
    </header>



    <!-- Post Meta (akan ditampilkan setelah post-title muncul) -->
    <div id="post-meta" class="post-meta" style="">
      <div itemprop="author" itemscope itemtype="http://schema.org/Person">
        <span id="post-author" itemprop="name">${author || "Unknown Author"}</span>
      </div>
      <span id="post-category">Category :${category || "Uncategorized"}</span> <span id="post-tags">Tags: ${tags || "No tags"}</span> <time itemprop="datePublished" datetime="${new Date(createdAt).toLocaleString() || "Unknown Date"}"><span id="post-date">Date: ${new Date(createdAt).toLocaleString() || "Unknown Date"}</span></time>
    </div><!-- class post-meta ditutup -->



    
    <!-- Container for post content -->
    <div id="post-container" class="post-container">
        <figure>
            <img itemprop="image" id="post-image" class="post-image" alt="${imageFileName}" style="top: 40%;" src="${imageFileUrl}"  />
            <!-- URL: <a href="${imageFileUrl}" target="_blank">${imageFileUrl}</a -->
        </figure>

        <!-- post-body yang akan ditampilkan setelah gambar selesai dimuat -->
        <div id="post-body" class="post-body" style="" itemprop="articleBody">${bodypost || "No bodypost content"}
        </div><!-- class post-body ditutup -->
        
          <!-- start of  Comment Section -->
            <br><br>
              <div id="comment_thread"></div>
          <!-- end of  Comment Section -->



          <script>
            createSearchForm();

            // Memanggil loadCusdis setelah halaman sepenuhnya dimuat
            window.addEventListener('load', loadCusdis);


          </script>
        </div><!-- class post-body ditutup -->
      <br><br><br><br>
            <!-- p>IP: ${ip || "Unknown IP"} | UA: ${user_agent || "Unknown UA"} | Ref: ${referrer || "Unknown Ref"}</p -->   
      <br>
    </div><!-- class post-container ditutup -->
    
    <!-- Placeholder untuk Footer -->
    <div id="footer-placeholder" class="footer-placeholder"></div>

    <footer>
    <nav class="footer-menu">
    <a href="/">Home</a>
    <a href="/privacy">Privacy</a>
    <a href="/about">About</a>
    <a href="/tos">ToS</a>
    <a href="/login/">Login</a>
    <a href="/rssfeed.xml">RSS Single</a>
    <a href="/rss.xml">RSS Multi</a>
    <a href="/sitemap.html">HTML Sitemap</a>
    <a href="/sitemap.xml">XML Sitemap</a>

    </nav>
    <br>
    <p>&copy; 2024 <a href="/">Post Netlify</a>. All rights reserved.</p>
    </footer>

  

    <script>
      /* document.addEventListener('DOMContentLoaded', async () => {
        await fetchPostBySlug(); // Fungsi untuk mengambil data dari Netlify
        updateJsonLdSchema();  // Fungsi untuk memperbarui schema JSON-LD
      });
    

      // Panggil fungsi saat halaman dimuat
      document.addEventListener('DOMContentLoaded', fetchPostBySlug);
      */

    </script>

  
    <!-- debug -->
    <div id="debug-info" class="debug-hidden">
      <p>
        siteName :<span id="siteNameFooter"></span><br>
        domain :<span id="domainFooter"></span><br>
        subdomain :<span id="subdomainFooter"></span><br>
        baseUrl :<a id="baseUrlFooter" href="#"></a><br>
        fullUrl :<span id="fullUrlFooter"></span><br>
        path :<span id="pathFooter"></span><br>
        supportEmail :<a id="supportEmailFooter" href="#"></a><br>
        current-year :<span id="current-yearFooter"></span><br>
        site-name :<span id="site-nameFooter"></span><br>
      </p>
    </div>



    

  
  </div><!-- class container ditutup -->

  <script src="/constanta.js" defer></script>
  <script>
    //Debugging akan muncul hanya jika Anda menambahkan ?debug=true ke URL, misalnya:
    //https://example.com/about.html?debug=true.
    if (window.location.search.includes('debug=true')) {
      document.getElementById('debug-info').classList.remove('debug-hidden');
    }
  </script>







    






      













</body>
</html>
`;

  const fileName = `${submission.data.slug || `submission-${index + 1}`}.html`;
  const filePath = path.join(tmpPath, fileName);

  fs.writeFileSync(filePath, htmlContent, "utf8");
  console.log(`File saved: ${filePath}`);
});


    
//////////////////////////////















    
    // Step 4: Upload file ke GitHub
    const fileList = fs.readdirSync(tmpPath);
    const report = []; // Array untuk menyimpan laporan status file

    for (const fileName of fileList) {
      const filePath = path.join(tmpPath, fileName);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const encodedContent = Buffer.from(fileContent).toString("base64");

      const githubApiUrl = `https://api.github.com/repos/${REPO}/contents/${STATIC_DIR}/${fileName}`;

      // Check if file already exists
      let sha = null;

      try {
        const fileCheckResponse = await axios.get(githubApiUrl, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        });
        sha = fileCheckResponse.data.sha;

        // Jika RECREATE adalah false, hanya update jika konten berbeda
        if (!RECREATE) {
          const existingContent = fileCheckResponse.data.content;
          const decodedContent = Buffer.from(existingContent, "base64").toString("utf8");
          if (decodedContent === fileContent) {
            console.log(`${fileName} is already up-to-date. Skipping upload.`);
            report.push({ file: fileName, status: "skipped",
                   time: new Date().toLocaleString()  
                   });
            continue;
          }
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`${fileName} does not exist, creating a new file.`);
        } else {
          throw new Error(`Error checking file: ${error.message}`);
        }
      }

      // Upload or update the file
      await axios.put(
        githubApiUrl,
        {
          message: `Create/Update ${fileName}`,
          content: encodedContent,
          sha: sha || undefined, // Sertakan SHA jika file ada
        },
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );

      console.log(`${fileName} uploaded successfully.`);
      report.push({ file: fileName, 
                   status: sha ? "updated" : "created",
                   time: new Date().toLocaleString()  
                  });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Files uploaded successfully to GitHub!",
        report: report,
      }, null, 2),
    };
  } catch (error) {
    console.error("Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }, null, 2),









      
    };
  }
};
