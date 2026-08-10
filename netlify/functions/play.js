const clueOverrides = require('./clue-overrides');

const SOCIAL_IMAGE = 'https://plot-twisted.netlify.app/social-preview.png?v=20260810b';
const SOCIAL_ALT = 'Plot Twisted movie trivia social card with the game branding, category icons, and a phone mockup showing a twisted movie clue.';

function applyClueOverrides(questions) {
  Object.entries(clueOverrides).forEach(([category, categoryOverrides]) => {
    const entries = questions[category];
    if (!Array.isArray(entries)) return;

    Object.entries(categoryOverrides).forEach(([title, clue]) => {
      const match = entries.find((entry) => entry.title === title);
      if (match) match.clue = clue;
    });
  });
  return questions;
}

function applySocialPreview(html) {
  return html
    .replace(/<meta property="og:image" content="[^"]+">/, `<meta property="og:image" content="${SOCIAL_IMAGE}">`)
    .replace(/<meta property="og:image:secure_url" content="[^"]+">/, `<meta property="og:image:secure_url" content="${SOCIAL_IMAGE}">`)
    .replace(/<meta property="og:image:width" content="[^"]+">/, '<meta property="og:image:width" content="1200">')
    .replace(/<meta property="og:image:height" content="[^"]+">/, '<meta property="og:image:height" content="630">')
    .replace(/<meta property="og:image:alt" content="[^"]+">/, `<meta property="og:image:alt" content="${SOCIAL_ALT}">`)
    .replace(/<meta name="twitter:image" content="[^"]+">/, `<meta name="twitter:image" content="${SOCIAL_IMAGE}">`)
    .replace(/<meta name="twitter:image:alt" content="[^"]+">/, `<meta name="twitter:image:alt" content="${SOCIAL_ALT}">`);
}

exports.handler = async function handler(event) {
  try {
    const baseUrl = event.rawUrl || `https://${event.headers.host}/play`;
    const isLanding = event.queryStringParameters?.view === 'landing';
    const htmlUrl = new URL(isLanding ? '/landing-v4.html' : '/index.html', baseUrl);

    if (isLanding) {
      const htmlResponse = await fetch(htmlUrl, { headers: { accept: 'text/html' } });
      if (!htmlResponse.ok) {
        return {
          statusCode: 502,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          body: 'The theater lobby could not load.'
        };
      }

      const html = applySocialPreview(await htmlResponse.text());
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=0, must-revalidate'
        },
        body: html
      };
    }

    const questionsUrl = new URL('/questions.json', baseUrl);
    const [htmlResponse, questionsResponse] = await Promise.all([
      fetch(htmlUrl, { headers: { accept: 'text/html' } }),
      fetch(questionsUrl, { headers: { accept: 'application/json' } })
    ]);

    if (!htmlResponse.ok || !questionsResponse.ok) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: 'The projection booth could not load the game.'
      };
    }

    const questions = applyClueOverrides(await questionsResponse.json());
    let html = applySocialPreview(await htmlResponse.text());
    const dataScript = `<script>window.PLOT_TWISTED_QUESTIONS=${JSON.stringify(questions).replace(/</g, '\\u003c')};</script>`;
    html = html.replace('<script src="./game.js"></script>', `${dataScript}\n<script src="./game.js"></script>`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate'
      },
      body: html
    };
  } catch (error) {
    console.error('Plot Twisted renderer failed', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: 'The projector jammed. Please refresh and try again.'
    };
  }
};
