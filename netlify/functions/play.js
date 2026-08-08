const clueOverrides = require('./clue-overrides');

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

exports.handler = async function handler(event) {
  try {
    const baseUrl = event.rawUrl || `https://${event.headers.host}/play`;
    const htmlUrl = new URL('/index.html', baseUrl);
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
    let html = await htmlResponse.text();
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
    console.error('Plot Twisted play renderer failed', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: 'The projector jammed. Please refresh and try again.'
    };
  }
};
