import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const PROFILE_SQL_PATH = 'C:/Users/Huy/Downloads/App/Profile User.sql';
const OUTPUT_FILE = 'C:/Users/Huy/Downloads/App/Profile User Blog.sql';
const TOTAL_POSTS = 10000;

// Mandatory Posts
const MANDATORY_POSTS = [
    { slug: 'beyond-like-button', title: 'Start Beyond the Like Button', date: '2026-01-28 09:00:00' },
    { slug: 'sovereign-path', title: 'The Sovereign Path', date: '2026-02-11 09:00:00' }, // 1 day ago (from Feb 12)
    { slug: 'arteo-social-covenant', title: 'Arteo Social Covenant', date: '2026-02-09 09:00:00' }, // 3 days ago
    { slug: 'ethics-algorithmic-transparency', title: 'Ethics of Algorithmic Transparency', date: '2026-02-07 09:00:00' }, // 5 days ago
    { slug: 'user-controlled-web-manifesto', title: 'User Controlled Web Manifesto', date: '2026-01-27 09:00:00' },
    { slug: 'what-is-algorithmic-fairness', title: 'What is Algorithmic Fairness?', date: '2026-02-04 09:00:00' }, // 8 days ago
    { slug: 'getting-started-recode-dsl', title: 'Getting Started with Recode DSL', date: '2026-01-28 14:00:00' },
    { slug: 'why-isolate-sandboxed-social', title: 'Why Isolate Sandboxed Social?', date: '2026-01-30 09:00:00' },
    { slug: 'what-is-arteo-social', title: 'What is Arteo Social?', date: '2026-01-31 09:00:00' }
];

// --- HELPERS ---
function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

function generatePostDate(): string {
    const start = new Date('2026-01-25T00:00:00');
    const end = new Date('2026-04-30T23:59:59');
    return formatDate(randomDate(start, end));
}

// --- MAIN LOGIC ---

console.log('Reading users from:', PROFILE_SQL_PATH);
const sqlContent = fs.readFileSync(PROFILE_SQL_PATH, 'utf-8');

// Regex to extract each value correctly, handling escaped quotes
// Format: ('username', 'email', 'pwd', 'role', 'headline', 'company', 'location', 'github', 'twitter', 'skills', ...)
// We specifically need skills which is JSON array [...]
// And location which is 'City, Country' or NULL
// Let's create a simplified parser.

interface User {
    id: number;
    username: string;
    location: string | null;
    skills: string[];
}
const users: User[] = [];

// Splitting by lines might work if each INSERT is on one line? Yes, generated script puts each on new line potentially.
// But some might span.
// Assuming generated script has 1 line per user + commas.
const lines = sqlContent.split('\n');
let userCount = 0;

for (const line of lines) {
    if (!line.trim().startsWith('(')) continue;

    // Remove start '(' and end '),
    const cleanLine = line.trim().replace(/^\(/, '').replace(/\),?$/, '');

    // Split by comma BUT respect quotes?
    // Regex to split by `', ` or `, '` or `, NULL`
    // Or extract specific fields.
    // Username is 1st: 'username'
    const usernameMatch = cleanLine.match(/^'([^']+)'/);
    const username = usernameMatch ? usernameMatch[1] : `User${userCount}`;

    // Location is 7th field.
    // Skills is 10th.
    // This is hard to regex globally.
    // Use split by `',` pattern?
    // Or just search for `['...']` pattern for skills, assuming only one JSON array per line.
    const skillsMatch = cleanLine.match(/'(\[.*?\])'/);
    let skills: string[] = [];
    if (skillsMatch) {
        try {
            skills = JSON.parse(skillsMatch[1]);
        } catch (e) {
            skills = ['Tech'];
        }
    } else {
        skills = ['General'];
    }

    // Location logic: Find the field before github/twitter?
    // Let's just use the `['...']` and extract text around it?
    // Or just randomly assign country if parsing fails to avoid errors.
    // Actually, `cleanLine` has structure.
    // Let's try to extract location. It's often 'City, Country'.
    // `..., 'City, Country', 'github', ...`
    // Regex: `, '([^']+)', '[^']+', '[^']+', '\[`
    // The skills is usually at the end.
    // Let's try simpler regex for location: `, '([^']+)', '[^']+', '[^']+', '\[` (Location, Github, Twitter, Skills)

    let location: string | null = null;
    const locMatch = cleanLine.match(/, '([^']+)', '[^']+', '[^']+', '\[/); // Location followed by 2 fields then skills
    if (locMatch) {
        location = locMatch[1];
    }

    users.push({ id: userCount + 1, username, location, skills });
    userCount++;
}

console.log(`Parsed ${users.length} users.`);
if (users.length === 0) {
    // Fallback Mock Users if parsing failed completely
    console.warn('Parsing failed, using mock users.');
    for (let i = 0; i < 100; i++) users.push({ id: i + 1, username: `User${i}`, location: 'USA', skills: ['Tech'] });
}


// Output Stream
const stream = fs.createWriteStream(OUTPUT_FILE, { flags: 'w' });

stream.write(`-- FILE: Profile User Blog.sql
-- Generated by Steve (2026-02-12)
-- TOTAL POSTS: ${TOTAL_POSTS}
-- MANDATORY POSTS Included.
-- Category ID 1 ('Blog') assumed.

USE recode_db;

-- Insert Category if not exists
INSERT IGNORE INTO categories (id, name, slug, description, icon_name) VALUES (1, 'Blog', 'blog', 'Official Recode Blog', 'newspaper');

INSERT INTO threads (category_id, user_id, title, slug, content, created_at, updated_at) VALUES
`);

// 2. Generate Posts

// A. Mandatory Posts (Assign to User 1, 2, 3 - assumed VIPs)
MANDATORY_POSTS.forEach((post, index) => {
    const user = users[index % users.length];
    const categoryId = 1;
    const content = `Welcome to the official blog post: ${post.title}. This post discusses important aspects of the Recode platform and its manifesto regarding user data sovereignty.`;

    // Escape single quotes
    const safeTitle = post.title.replace(/'/g, "''");
    const safeContent = content.replace(/'/g, "''");

    const values = `(
    ${categoryId}, ${user.id}, '${safeTitle}', '${post.slug}', '${safeContent}',
    '${post.date}', '${post.date}'
)`;
    stream.write(values + ',\n');
});

// B. Random Posts
const TOPIC_TEMPLATES = [
    "The Future of {TOPIC} in {COUNTRY}",
    "Why {TOPIC} is booming in {COUNTRY}",
    "Top 10 {TOPIC} Trends in {COUNTRY} for 2026",
    "How to Master {TOPIC} effectively",
    "Building {TOPIC} applications with Recode",
    "Scaling {TOPIC} systems: A guide",
    "My journey learning {TOPIC} in {COUNTRY}",
    "Best practices for {TOPIC} development",
    "{TOPIC}: A deep dive analysis",
    "State of {TOPIC} in {COUNTRY} - Q1 Report"
];

const totalRandom = TOTAL_POSTS - MANDATORY_POSTS.length;

for (let i = 0; i < totalRandom; i++) {
    // Pick a user
    let user = randomElement(users);

    // Country Logic
    let country = "Global";
    if (user.location) {
        const loc = user.location;
        if (loc.includes("TX") || loc.includes("CA") || loc.includes("NY") || loc.includes("WA") || loc.includes("USA")) country = "USA";
        else if (loc.includes("Japan") || loc.includes("Tokyo")) country = "Japan";
        else if (loc.includes("China") || loc.includes("Beijing")) country = "China";
        else if (loc.includes("Korea") || loc.includes("Seoul")) country = "South Korea";
        else if (loc.includes("Vietnam") || loc.includes("Hanoi")) country = "Vietnam";
        else if (loc.includes("Germany") || loc.includes("Berlin")) country = "Germany";
        else if (loc.includes("France") || loc.includes("Paris")) country = "France";
        else if (loc.includes("India") || loc.includes("Mumbai")) country = "India";
        else country = loc.split(',').pop()?.trim() || "Global";
    }

    let topic = "Technology";
    if (user.skills && user.skills.length > 0) {
        topic = randomElement(user.skills);
    }

    const template = randomElement(TOPIC_TEMPLATES);
    const title = template.replace("{TOPIC}", topic).replace("{COUNTRY}", country);

    // Slug: title only (cleanup as per user request)
    const slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // Content (Simulated)
    const content = `In this post, we explore the landscape of **${topic}** specifically within **${country}**. 
    As the tech ecosystem evolves, understanding ${topic} becomes crucial for developers and businesses alike. 
    Here are key insights from my experience working in ${country}...`;

    const date = generatePostDate();

    const safeTitle = title.replace(/'/g, "''");
    const safeContent = content.replace(/'/g, "''");

    const values = `(
    1, ${user.id}, '${safeTitle}', '${slug}', '${safeContent}',
    '${date}', '${date}'
)`;

    // Write
    const isLast = i === totalRandom - 1;
    stream.write(values + (isLast ? ';' : ',\n'));

    if (i % 1000 === 0) process.stdout.write(`Generated ${i} posts...\r`);
}

console.log('Done! Blog SQL generated at:', OUTPUT_FILE);
stream.end();
