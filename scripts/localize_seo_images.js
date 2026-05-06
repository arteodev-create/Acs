require('dotenv').config({ path: process.env.ENV_FILE || '.env' });

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
const publicDir = process.env.SEO_IMAGE_PUBLIC_DIR || '/home/ubuntu/recode-deploy/current/frontend/seo-images';
const publicPrefix = process.env.SEO_IMAGE_PUBLIC_PREFIX || '/seo-images';
const maxContentImages = Number(process.env.MAX_CONTENT_IMAGES || 1800);
const maxAvatars = Number(process.env.MAX_AVATARS || 1200);
const profileListPath = process.env.PROFILE_USERNAMES_FILE || '';

const imagePattern = /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)|<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
const downloadedUrls = new Map();

function extensionFrom(contentType, url) {
  if (contentType && contentType.includes('png')) return 'png';
  if (contentType && contentType.includes('webp')) return 'webp';
  if (contentType && contentType.includes('gif')) return 'gif';
  if (contentType && contentType.includes('jpeg')) return 'jpg';
  const clean = url.split('?')[0].toLowerCase();
  const match = clean.match(/\.(png|webp|gif|jpe?g)$/);
  return match ? match[1].replace('jpeg', 'jpg') : 'jpg';
}

function fileBase(url) {
  return crypto.createHash('sha1').update(url).digest('hex').slice(0, 24);
}

async function downloadImage(url, bucket) {
  if (downloadedUrls.has(url)) return downloadedUrls.get(url);

  const response = await fetch(url, {
    headers: { 'user-agent': 'RecodeSEOImageLocalizer/1.0' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error(`Not image: ${contentType}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 256 || bytes.length > 8 * 1024 * 1024) {
    throw new Error(`Unexpected size: ${bytes.length}`);
  }

  const ext = extensionFrom(contentType, url);
  const dir = path.join(publicDir, bucket);
  await fs.mkdir(dir, { recursive: true });
  const name = `${fileBase(url)}.${ext}`;
  const output = path.join(dir, name);
  await fs.writeFile(output, bytes);
  const localUrl = `${publicPrefix}/${bucket}/${name}`;
  downloadedUrls.set(url, localUrl);
  return localUrl;
}

async function localizeContentTable(table, idColumn) {
  const { rows } = await pool.query(
    `SELECT ${idColumn} AS id, content FROM ${table} WHERE content ~ 'https?://[^ )]+' ORDER BY ${idColumn} ASC LIMIT $1`,
    [maxContentImages]
  );

  let changed = 0;
  let downloaded = 0;
  for (const row of rows) {
    let content = row.content || '';
    const matches = [...content.matchAll(imagePattern)];
    for (const match of matches) {
      const remoteUrl = match[1] || match[2];
      if (!remoteUrl || remoteUrl.includes(publicPrefix)) continue;
      try {
        const localUrl = await downloadImage(remoteUrl, table);
        content = content.split(remoteUrl).join(localUrl);
        downloaded += 1;
      } catch (error) {
        console.warn(`[image-skip] ${remoteUrl} :: ${error.message}`);
      }
    }
    if (content !== row.content) {
      await pool.query(`UPDATE ${table} SET content = $1 WHERE ${idColumn} = $2`, [content, row.id]);
      changed += 1;
    }
  }
  return { table, changed, downloaded };
}

async function localizeAvatars() {
  let usernames = [];
  if (profileListPath) {
    try {
      usernames = (await fs.readFile(profileListPath, 'utf8')).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    } catch {
      usernames = [];
    }
  }

  const params = [];
  let where = "avatar_url LIKE 'http%'";
  if (usernames.length) {
    params.push(usernames.slice(0, maxAvatars));
    where += ' AND username = ANY($1)';
  }
  params.push(maxAvatars);
  const limitParam = params.length;

  const { rows } = await pool.query(
    `SELECT id, avatar_url FROM users WHERE ${where} ORDER BY reputation_points DESC, id ASC LIMIT $${limitParam}`,
    params
  );

  let changed = 0;
  let downloaded = 0;
  for (const row of rows) {
    try {
      const localUrl = await downloadImage(row.avatar_url, 'avatars');
      await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [localUrl, row.id]);
      changed += 1;
      downloaded += 1;
    } catch (error) {
      console.warn(`[avatar-skip] ${row.avatar_url} :: ${error.message}`);
    }
  }
  return { table: 'users', changed, downloaded };
}

async function main() {
  await fs.mkdir(publicDir, { recursive: true });
  const results = [];
  results.push(await localizeContentTable('blog_posts', 'id'));
  results.push(await localizeContentTable('threads', 'id'));
  results.push(await localizeAvatars());
  console.log(JSON.stringify({ ok: true, publicDir, publicPrefix, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await pool.end();
});
