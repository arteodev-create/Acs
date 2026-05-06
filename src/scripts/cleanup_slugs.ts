import pool from '../config/database';
import { slugify } from './ecosystem/helpers';

/**
 * Script to clean up existing slugs in the database.
 * Removes the trailing random numbers (e.g., "-123456").
 */
async function cleanupSlugs() {
    console.log('Starting slug cleanup...');

    try {
        // 1. Clean Threads Slugs
        console.log('Cleaning threads slugs...');
        const [threads]: any = await pool.query('SELECT id, title, slug FROM threads');
        for (const thread of threads) {
            const cleanSlug = slugify(thread.title);
            if (cleanSlug !== thread.slug) {
                await pool.query('UPDATE threads SET slug = ? WHERE id = ?', [cleanSlug, thread.id]);
                console.log(`Updated thread ${thread.id}: ${thread.slug} -> ${cleanSlug}`);
            }
        }

        // 2. Clean Blog Posts Slugs
        console.log('Cleaning blog_posts slugs...');
        const [blogs]: any = await pool.query('SELECT id, title, slug FROM blog_posts');
        for (const blog of blogs) {
            const cleanSlug = slugify(blog.title);
            if (cleanSlug !== blog.slug) {
                await pool.query('UPDATE blog_posts SET slug = ? WHERE id = ?', [cleanSlug, blog.id]);
                console.log(`Updated blog ${blog.id}: ${blog.slug} -> ${cleanSlug}`);
            }
        }

        console.log('Slug cleanup completed successfully.');
    } catch (error) {
        console.error('Error during slug cleanup:', error);
    } finally {
        process.exit();
    }
}

cleanupSlugs();
