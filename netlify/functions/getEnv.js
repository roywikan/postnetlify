exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      GITHUB_API_URL: `https://api.github.com/repos/${process.env.REPO}/contents/${process.env.FILE_PATH}`,
      TOKEN: process.env.GITHUB_TOKEN,
    }),
  };
};
