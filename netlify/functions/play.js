exports.handler = async function handler(event) {
  try {
    const baseUrl = event.rawUrl || `https://${event.headers.host}/play`;
    const sourceUrl = new URL('/index.html', baseUrl);
    const response = await fetch(sourceUrl, { headers: { accept: 'text/html' } });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: 'The projection booth could not load the game.'
      };
    }

    let html = await response.text();
    if (!html.includes('game-enhancements.css')) {
      html = html.replace(
        '</head>',
        '  <link rel="stylesheet" href="/game-enhancements.css">\n</head>'
      );
    }
    if (!html.includes('game-enhancements.js')) {
      html = html.replace(
        '</body>',
        '  <script src="/game-enhancements.js"></script>\n</body>'
      );
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate'
      },
      body: html
    };
  } catch (error) {
    console.error('Plot Twisted play renderer failed', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: 'The projector jammed. Please refresh and try again.'
    };
  }
};
