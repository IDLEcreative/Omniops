import { JSDOM } from 'jsdom';

export function createTestDOM(): JSDOM {
  const elements: string[] = [];

  elements.push('<header class="header"><nav class="navbar">Site Nav</nav></header>');
  elements.push('<aside class="sidebar">Sidebar content</aside>');
  elements.push('<footer class="footer">Footer content</footer>');

  for (let i = 0; i < 1000; i++) {
    const type = i % 10;

    if (type === 0) {
      elements.push(`
        <div class="nav-item-${i}">
          <a href="#">Link 1</a>
          <a href="#">Link 2</a>
          <a href="#">Link 3</a>
          <a href="#">Link 4</a>
          <a href="#">Link 5</a>
          <a href="#">Link 6</a>
        </div>
      `);
    } else if (type === 1) {
      elements.push(`<div class="ad-container-${i}"><div class="ad">Advertisement</div></div>`);
    } else if (type === 2) {
      elements.push(`
        <section class="social-share-${i}">
          <a href="#">FB</a><a href="#">TW</a><a href="#">IN</a>
        </section>
      `);
    } else if (type === 3) {
      elements.push(`
        <article class="article-${i}">
          <p>This is some real content that should be kept. It has enough text to pass the minimal text filter.</p>
          <a href="#">Read more</a>
        </article>
      `);
    } else {
      elements.push(`
        <div id="content-${i}" class="content-block">
          <h2>Section ${i}</h2>
          <p>Content paragraph with meaningful text that should be preserved during extraction.</p>
        </div>
      `);
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Test Page</title></head>
      <body>
        ${elements.join('\n')}
      </body>
    </html>
  `;

  return new JSDOM(html, { url: 'https://example.com/test' });
}
