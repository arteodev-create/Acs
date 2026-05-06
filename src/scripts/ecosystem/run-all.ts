import { generateCategories } from './gen-categories';
import { generateUsers } from './gen-users';
import { generateThreads } from './gen-threads';
import { generatePosts } from './gen-posts';
import { generateReactions } from './gen-reactions';
import { generateFollows } from './gen-follows';
import { generateNotifications } from './gen-notifications';
import { generateBlogPosts } from './gen-blog-posts';
import { generateRecodeScripts } from './gen-recode-scripts';
import { generateSystemStatus } from './gen-system-status';

// ═══════════════════════════════════════════════════════════
// RUN ALL — Orchestrates all generators in FK-safe order
// ═══════════════════════════════════════════════════════════

async function main() {
    const startTime = Date.now();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🚀  RE-CODE ECOSYSTEM GENERATOR');
    console.log('  60,000 users • 24K threads • 180K posts • 300K reactions');
    console.log('═══════════════════════════════════════════════════════════');

    // 1. Categories (no FK dependencies)
    await generateCategories();

    // 2. Users (no FK dependencies)
    const users = await generateUsers();

    // 3. Threads (depends on: users, categories)
    const threads = await generateThreads(users);

    // 4. Posts (depends on: users, threads)
    const posts = await generatePosts(users, threads);

    // 5. Reactions (depends on: users, threads, posts)
    await generateReactions(users, threads, posts);

    // 6. Follows (depends on: users)
    await generateFollows(users);

    // 7. Notifications (depends on: users, threads, posts)
    await generateNotifications(users, threads, posts);

    // 8. Blog Posts (depends on: users)
    await generateBlogPosts(users);

    // 9. Recode Scripts (depends on: users)
    await generateRecodeScripts(users);

    // 10. System Status (no FK dependencies)
    await generateSystemStatus();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`  ✅  ALL DONE in ${elapsed}s`);
    console.log('  SQL files saved to: C:/Users/Huy/Downloads/App/Dữ Liệu/');
    console.log('═══════════════════════════════════════════════════════════');
}

main().catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
