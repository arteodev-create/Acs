/**
 * Slugify a string: convert to lowercase, remove special characters, and replace spaces with hyphens.
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 200);
}
