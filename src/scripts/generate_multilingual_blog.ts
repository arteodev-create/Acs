
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const PROFILE_SQL_PATH = 'C:/Users/Huy/Downloads/App/Profile User.sql';
const FORUM_OUTPUT_FILE = 'C:/Users/Huy/Downloads/App/Profile User Blog.sql';
const BLOG_OUTPUT_FILE = 'C:/Users/Huy/Downloads/App/uSER bLOG.SQL';
const TOTAL_POSTS = 10000;
const CATEGORY_ID = 1;

// --- MULTIMEDIA ASSETS ---
const SAMPLE_YOUTUBE_IDS = ['dQw4w9WgXcQ', '9bZkp7q19f0', 'YQHsXMglC9A', 'L_jWHffIx5E', 'V-_O7nl0Ii0'];
const SAMPLE_IMAGE_KEYWORDS = ['technology', 'engineering', 'coding', 'architecture', 'cybersecurity', 'ai', 'database', 'cloud', 'rust-lang', 'software'];
const USEFUL_LINKS = [
    { name: 'Arteo Social GitHub', url: 'https://github.com/arteo-social' },
    { name: 'Rust Documentation', url: 'https://doc.rust-lang.org/' },
    { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
    { name: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' },
    { name: 'Recode DSL Guide', url: 'https://recode.arteosocial.com/docs/dsl' }
];

// --- MANDATORY SEO POSTS ---
const MANDATORY_POSTS = [
    { slug: 'beyond-like-button', title: 'Beyond the Like Button: The Future of Interaction', lang: 'en' },
    { slug: 'sovereign-path', title: 'The Sovereign Path: Owning Your Digital Identity', lang: 'en' },
    { slug: 'sovereign-path-ahead', title: 'The Sovereign Path Ahead: Digital Autonomy in 2026', lang: 'en', author: 'timothyyoung1' },
    { slug: 'arteo-social-covenant', title: 'Arteo Social Covenant: Our Promise to Users', lang: 'en' },
    { slug: 'ethics-algorithmic-transparency', title: 'The Ethics of Algorithmic Transparency', lang: 'en' },
    { slug: 'user-controlled-web-manifesto', title: 'User Controlled Web Manifesto', lang: 'en' },
    { slug: 'what-is-algorithmic-fairness', title: 'What is Algorithmic Fairness?', lang: 'en' },
    { slug: 'getting-started-recode-dsl', title: 'Getting Started with Recode DSL', lang: 'en' },
    { slug: 'why-isolate-sandboxed-social', title: 'Why Isolate Sandboxed Social?', lang: 'en' },
    { slug: 'what-is-arteo-social', title: 'What is Arteo Social?', lang: 'en' }
];

// --- REAL-HUMAN DYNAMIC ENGINE V7 ---
type LangPack = {
    intros: string[];
    bridge: string[];
    details: string[];
    opinions: string[];
    conclusions: string[];
    titleStarts: string[];
    titleCores: string[];
    titleEnds: string[];
    commentShort: string[];
    commentLong: string[];
};

const DYNAMIC_SAMPLES: Record<string, LangPack> = {
    'vi': {
        titleStarts: ["Tại sao", "Sự thật về", "Góc nhìn:", "Chia sẻ", "Cảnh báo:", "Review", "Hướng dẫn", "Làm sao để", "Đừng bỏ qua", "Hành trình"],
        titleCores: ["AI và Chatbot", "Lập trình Rust", "Frontend 2026", "Freelance IT", "System Design", "Tối ưu Database", "Clean Code", "Microservices", "Tự học Code", "Lương ngành IT"],
        titleEnds: ["trong thực tế", "năm 2026", "bạn cần biết", "cho người mới", "và bài học", "hiệu quả nhất", "đã thay đổi mình", "- Phần 1", "ở Việt Nam", "vô cùng quan trọng"],
        intros: [
            "Công nghệ không đứng yên, nó đang chảy như một dòng sông cuồn cuộn.",
            "Tại sao chúng ta cứ mải mê chạy theo công cụ mà quên mất tư duy nền tảng?",
            "Hôm nay mình muốn nói về một chủ đề 'cũ nhưng không bao giờ lỗi thời'.",
            "Có bao giờ bạn tự hỏi: Code của mình sẽ đi về đâu sau 5 năm nữa?",
            "Ngành IT Việt Nam đang đứng trước một ngưỡng cửa lớn của sự thay đổi."
        ],
        bridge: [
            "Chúng ta cần nhìn nhận vấn đề này từ một lăng kính đa chiều hơn.",
            "Để giải quyết triệt để, chúng ta buộc phải thay đổi cách tiếp cận truyền thống.",
            "Hãy thử tưởng tượng một thế giới nơi mà mọi dòng code đều có giá trị bền vững.",
            "Vấn đề không nằm ở 'làm thế nào', mà nằm ở 'tại sao chúng ta lại làm vậy'.",
            "Đừng để sự phức tạp đánh lừa, bản chất thật sự của nó rất đơn giản."
        ],
        details: [
            "Chi tiết đầu tiên mà ai cũng mắc phải chính là việc vội vàng tối ưu hóa khi chưa cần thiết. Điều này gây lãng phí tài nguyên và làm rối cấu trúc.",
            "Hệ thống phân tán mang lại sức mạnh khủng khiếp nhưng đi kèm với đó là cái giá về độ phức tạp của việc đồng bộ hóa dữ liệu trên quy mô lớn.",
            "Thực tế cho thấy, các kỹ sư giỏi nhất không phải là người viết nhiều code nhất, mà là người biết viết code sao cho người khác dễ dàng xóa bỏ nó nhất.",
            "Việc ứng dụng AI vào quy trình CI/CD đang mở ra những khả năng tự động hóa mà trước đây chúng ta chỉ dám mơ tới trong các bộ phim viễn tưởng.",
            "An ninh mạng trong năm 2026 sẽ không còn là một lựa chọn, nó là một yếu tố sống còn cho bất kỳ sản phẩm số nào muốn tồn tại."
        ],
        opinions: [
            "Cá nhân tôi tin rằng, đạo đức trong lập trình sẽ trở thành kỹ năng quan trọng nhất của thập kỷ này.",
            "Mọi công cụ đều có hai mặt, quan trọng là người thợ sử dụng nó theo mục đích nào.",
            "Đôi khi lùi một bước để nhìn lại kiến trúc tổng thể lại giúp chúng ta tiến xa hơn mười bước.",
            "Sự hào nhoáng của các framework mới không nên làm chúng ta quên đi các nguyên lý khoa học máy tính cơ bản.",
            "Lập trình là nghệ thuật của sự trừu tượng, và người giỏi nghệ thuật này sẽ làm chủ trò chơi."
        ],
        conclusions: [
            "Cuối cùng, hãy nhớ rằng máy tính chỉ là công cụ, con người mới là trung tâm của mọi giải pháp.",
            "Hãy tiếp tục sáng tạo, tiếp tục sai lầm, vì đó là cách chúng ta trưởng thành.",
            "Hy vọng những dòng chia sẻ tâm huyết này sẽ truyền được chút cảm hứng cho các bạn trẻ.",
            "Hẹn gặp lại các bạn ở những chủ đề sâu hơn và thực tế hơn nữa.",
            "Chúc các bạn có một ngày làm việc hiệu quả và tràn đầy niềm vui sáng tạo!"
        ],
        commentShort: ["Bài viết hay!", "Ngắn gọn mà đủ ý.", "Chuẩn bác.", "Quá đúng.", "Cảm ơn đã chia sẻ!", "Vote 1 phiếu."],
        commentLong: [
            "Đọc xong bài viết này mình thấy ngộ ra được nhiều điều. Thực sự là bấy lâu nay mình quá tập trung vào framework mà quên mất cái core bên dưới. Những chia sẻ của bác rất sâu sắc và có tầm nhìn xa. Hy vọng có thêm nhiều bài viết như thế này nữa để nâng tầm cộng đồng dev Việt.",
            "Rất đồng tình với quan điểm của bác về việc tối ưu hóa sớm là nguồn gốc của mọi tội lỗi. Mình đã từng làm hỏng một project chỉ vì ham hố áp dụng thiết kế quá phức tạp khi quy mô còn nhỏ. Bài viết này như một lời cảnh tỉnh kịp thời cho mình và team.",
            "Phần nói về đạo đức trong AI cực kỳ ấn tượng. Chúng ta đang tiến quá nhanh đôi khi không kịp nhìn lại những hệ lụy. Bác có thể làm thêm một bài về Algorithmic Fairness được không? Mình nghĩ chủ đề đó rất phù hợp với bối cảnh hiện nay."
        ]
    },
    'en': {
        titleStarts: ["Why", "The Truth of", "Inside", "Revealing", "The Future of", "How to", "Redesigning", "Why I left", "Mastering", "Deep Dive:"],
        titleCores: ["AI Governance", "Modern Rust", "System Resilience", "Cybersecurity", "TypeScript 6.0", "Cloud Native", "DevOps Culture", "UI/UX Trends", "Backend Scalability", "Software Ethics"],
        titleEnds: ["in 2026", "a survival guide", "for professionals", "that actually works", "explained simply", "and lessons learned", "the hard way", "vignettes", "from the trenches", "blueprint"],
        intros: [
            "We are witnessing a monumental shift in how we perceive digital systems.",
            "Technology is the leverage, but your philosophy is the compass.",
            "Stop following the hype and start building with purpose.",
            "Innovation is often just old ideas applied to new problems.",
            "I spent years fighting the wrong battles until I realized this one truth."
        ],
        bridge: [
            "To truly dominate this field, one must understand the invisible structures at play.",
            "Complexity is a tax on your development speed; learn to pay it wisely.",
            "Let's strip away the marketing buzz and look at the raw underlying logic.",
            "The bridge between idea and execution is paved with hundreds of micro-decisions.",
            "It's not about the code you write; it's about the value you create with it."
        ],
        details: [
            "Modern architecture demands a level of fault tolerance that was previously reserved for aerospace and medical systems. Reliability is no longer a luxury.",
            "Data sovereignty is the next frontier. As users become more aware of their digital footprint, our systems must evolve to respect privacy by design.",
            "Vector databases and neural embeddings are transforming search from keyword matching to deep semantic understanding of human intent.",
            "Low-level performance optimization in languages like Rust is becoming increasingly relevant as cloud costs dominate venture-backed burn rates.",
            "The convergence of AI and edge computing means our devices are becoming smarter, more private, and less dependent on centralized giant towers."
        ],
        opinions: [
            "I firmly believe that the most valuable engineers of the next decade will be generalists who can navigate the entire stack with empathy.",
            "Software is eating the world, but it's the quality of the 'mouth' that determines if the world gets nourished or poisoned.",
            "Simplicity is the ultimate sophistication, but getting there requires an immense amount of intellectual discipline.",
            "We should be worried less about AI taking jobs and more about poor code taking down our infrastructure.",
            "The best code is the code you never have to write; the second best is the code you can easily delete."
        ],
        conclusions: [
            "In conclusion, build things that matter. The world has enough shallow apps.",
            "Continue to learn, continue to challenge your assumptions, and stay sovereign.",
            "I hope this deep dive sparked some curiosity in your engineering mind.",
            "Looking forward to hearing your thoughts in the discussion below.",
            "Stay hungry, stay foolish, and keep shipping meaningful software."
        ],
        commentShort: ["Great read!", "Solid point.", "Well articulated.", "Thanks for the insights.", "Spot on.", "Love this.", "100%."],
        commentLong: [
            "This is by far the most comprehensive piece I've read on this topic this year. Your perspective on data sovereignty perfectly aligns with what we're trying to build at my current startup. We need more thinkers like you in the tech space to keep us honest about what we're creating.",
            "The point about maintainability vs. novelty really hit home. I've been a victim of 'resume-driven development' in the past, and it cost my previous company months of refactoring. Your advice on simplicity should be mandatory reading for every junior dev entering the industry.",
            "I appreciate the deep focus on ethics. We often forget that we are responsible for the algorithms we release into the wild. The bias in modern LLMs is a systemic issue, and your call for algorithmic transparency is exactly what we need right now."
        ]
    }
};

interface User {
    id: number;
    username: string;
    location: string | null;
    countryCode: string;
}

// --- PARSER ---
function parseUsers(sqlContent: string): User[] {
    const users: User[] = [];
    const blocks = sqlContent.split(/\),\s*\(/);
    let id = 1;
    for (let block of blocks) {
        block = block.replace(/^[^(]*\(/, '').replace(/\)[^)]*$/, '');
        const fields = block.split(/',\s*'/).map(f => f.replace(/^'|'$/g, '').trim());
        if (fields.length >= 7) {
            const username = fields[0];
            const location = fields[6];
            let lang = 'en';
            const locLower = (location || "").toLowerCase();
            if (locLower.includes('vietnam') || locLower.includes('vn')) lang = 'vi';
            users.push({ id: id++, username, location, countryCode: lang });
        }
    }
    return users;
}

function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomElement<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function slugify(text: string): string {
    let s = text.toString().toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (!s) s = 'article';
    return s.substring(0, 50);
}

// --- ENHANCEMENT ENGINE ---
function generateRichContent(pack: LangPack, title: string): string {
    let bodyArr = [
        randomElement(pack.intros),
        randomElement(pack.bridge),
        randomElement(pack.details)
    ];

    // Ngẫu nhiên chèn Multimedia (50% cơ hội mỗi loại)
    if (Math.random() < 0.5) {
        const keyword = randomElement(SAMPLE_IMAGE_KEYWORDS);
        bodyArr.push(`\n![${title} - ${keyword}](https://source.unsplash.com/featured/?${keyword})\n`);
    }

    if (Math.random() < 0.4) {
        const videoId = randomElement(SAMPLE_YOUTUBE_IDS);
        bodyArr.push(`\nCheck out this insightful video on the topic: https://www.youtube.com/watch?v=${videoId}\n`);
    }

    bodyArr.push(randomElement(pack.opinions));

    if (Math.random() < 0.6) {
        const link = randomElement(USEFUL_LINKS);
        bodyArr.push(`\nFor more information, visit: [${link.name}](${link.url})\n`);
    }

    bodyArr.push(randomElement(pack.conclusions));
    return bodyArr.join("\n\n");
}

// --- MAIN ---
console.log('Generating SEO-Rich Dual-Content (Forum & Blog)...');
const userSql = fs.readFileSync(PROFILE_SQL_PATH, 'utf-8');
const usersList = parseUsers(userSql);
console.log(`Ready with ${usersList.length} user profiles.`);

const forumStream = fs.createWriteStream(FORUM_OUTPUT_FILE);
const blogStream = fs.createWriteStream(BLOG_OUTPUT_FILE);

forumStream.write(`USE recode_social;\n\n-- FORUM THREADS & POSTS\nINSERT IGNORE INTO categories (id, name, slug, description, icon_name) VALUES (1, 'Engineering', 'engineering', 'Technical discussions and engineering insights', 'MessageSquare');\n\n`);
blogStream.write(`USE recode_social;\n\n-- BLOG POSTS\n\n`);

// 1. MANDATORY POSTS (Strict Slugs) - ONLY FOR BLOG
MANDATORY_POSTS.forEach((post, i) => {
    let user = usersList[i % usersList.length];
    if ((post as any).author) {
        const found = usersList.find(u => u.username === (post as any).author);
        if (found) user = found;
    }
    const pack = DYNAMIC_SAMPLES[post.lang] || DYNAMIC_SAMPLES['en'];
    const content = generateRichContent(pack, post.title);
    const summary = content.substring(0, 150).replace(/'/g, "''") + "...";
    const date = `2026-01-25 09:00:00`;

    blogStream.write(`INSERT INTO blog_posts (author_id, title, slug, summary, content, category, created_at, updated_at) VALUES (${user.id}, '${post.title.replace(/'/g, "''")}', '${post.slug}', '${summary}', '${content.replace(/'/g, "''")}', 'Engineering', '${date}', '${date}');\n`);
});

// 2. POLYMORPHIC MIXED POSTS
for (let i = 0; i < TOTAL_POSTS - MANDATORY_POSTS.length; i++) {
    const user = randomElement(usersList);
    const lang = user.countryCode;
    const pack = DYNAMIC_SAMPLES[lang] || DYNAMIC_SAMPLES['en'];

    const title = `${randomElement(pack.titleStarts)} ${randomElement(pack.titleCores)} ${randomElement(pack.titleEnds)}`;
    const content = generateRichContent(pack, title);
    const summary = content.substring(0, 150).replace(/'/g, "''") + "...";
    const slugBase = slugify(title);
    const slug = slugBase;

    const month = randomInt(1, 2);
    const day = month === 1 ? randomInt(1, 31) : randomInt(1, 10);
    const date = `2026-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${randomInt(0, 23).toString().padStart(2, '0')}:${randomInt(0, 59).toString().padStart(2, '0')}:00`;

    if (i % 2 === 0) {
        // FORUM
        forumStream.write(`INSERT INTO threads (category_id, user_id, title, slug, content, created_at, updated_at) VALUES (${CATEGORY_ID}, ${user.id}, '${title.replace(/'/g, "''")}', '${slug}', '${content.replace(/'/g, "''")}', '${date}', '${date}');\n`);
        forumStream.write(`SET @last_thread_id = LAST_INSERT_ID();\n`);
        const n = randomInt(0, 2);
        for (let k = 0; k < n; k++) {
            const comment = randomInt(0, 10) < 8 ? randomElement(pack.commentShort) : randomElement(pack.commentLong);
            const cDateRaw = new Date(new Date(date).getTime() + randomInt(60000, 345600000));
            const cDate = cDateRaw.toISOString().slice(0, 19).replace('T', ' ');
            forumStream.write(`INSERT INTO posts (thread_id, user_id, content, created_at, updated_at) VALUES (@last_thread_id, ${randomElement(usersList).id}, '${comment.replace(/'/g, "''")}', '${cDate}', '${cDate}');\n`);
        }
    } else {
        // BLOG
        const category = randomElement(['Engineering', 'System Design', 'Social DSL', 'Sovereignty', 'Protocols', 'Cloud Native']);
        blogStream.write(`INSERT INTO blog_posts (author_id, title, slug, summary, content, category, created_at, updated_at) VALUES (${user.id}, '${title.replace(/'/g, "''")}', '${slug}', '${summary}', '${content.replace(/'/g, "''")}', '${category}', '${date}', '${date}');\n`);
    }

    if (i % 1000 === 0) process.stdout.write(`Generated ${i} mixed records...\r`);
}

forumStream.end();
blogStream.end();
console.log(`\nAll Done!\n- Multimedia & SEO-Rich Forum (Threads/Posts) saved to: ${FORUM_OUTPUT_FILE}\n- Multimedia & SEO-Rich Blog (blog_posts) saved to: ${BLOG_OUTPUT_FILE}`);
