const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, 'posts');
const TEMPLATE_PATH = path.join(__dirname, 'template.html');
const OUTPUT_PATH = path.join(__dirname, 'index.html');

// Helper: Parse frontmatter
function parsePost(filename) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
    const parts = raw.split('---');
    if (parts.length < 3) return null;

    const metaRaw = parts[1].trim();
    const contentRaw = parts.slice(2).join('---').trim();

    const meta = {};
    metaRaw.split('\n').forEach(line => {
        const [k, v] = line.split(':').map(s => s.trim());
        if (k && v) meta[k] = v.replace(/^"|"$/g, ''); // strip quotes
    });

    // Convert markdown paragraphs to HTML <p> (very basic parser)
    const htmlContent = contentRaw
        .split('\n\n')
        .map(p => `<p>${p.trim()}</p>`)
        .join('\n');

    return {
        ...meta,
        content: htmlContent,
        filename
    };
}

function build() {
    // 1. Read all posts
    const posts = fs.readdirSync(POSTS_DIR)
        .filter(f => f.endsWith('.md'))
        .map(parsePost)
        .filter(p => p)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort desc

    // 2. Generate articles HTML
    const articlesHtml = posts.map(post => `
        <article class="entry">
            <div class="entry-header">
                <span class="timestamp">[${post.date}]</span>
                <span class="tag">${post.tag}</span>
            </div>
            <div class="content">
                ${post.content}
            </div>
        </article>
    `).join('\n');

    // 3. Read template
    let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    // 4. Inject
    const finalHtml = template.replace('{{CONTENT}}', articlesHtml);

    // 5. Write
    fs.writeFileSync(OUTPUT_PATH, finalHtml);
    console.log(`Build complete: ${posts.length} posts.`);
}

build();