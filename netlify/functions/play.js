const clueOverrides = require('./clue-overrides');

function applyClueOverrides(html) {
  const prefix = 'const QUESTIONS = ';
  const suffix = ';\nconst CAT_META =';
  const start = html.indexOf(prefix);
  const end = html.indexOf(suffix, start);

  if (start === -1 || end === -1) return html;

  try {
    const jsonStart = start + prefix.length;
    const questions = JSON.parse(html.slice(jsonStart, end));

    Object.entries(clueOverrides).forEach(([category, categoryOverrides]) => {
      const entries = questions[category];
      if (!Array.isArray(entries)) return;

      Object.entries(categoryOverrides).forEach(([title, clue]) => {
        const match = entries.find((entry) => entry.title === title);
        if (match) match.clue = clue;
      });
    });

    return `${html.slice(0, jsonStart)}${JSON.stringify(questions)}${html.slice(end)}`;
  } catch (error) {
    console.error('Plot Twisted clue override failed', error);
    return html;
  }
}

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

    let html = applyClueOverrides(await response.text());
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
