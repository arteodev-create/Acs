import {
    TOTAL_USERS, PHASE_A, PHASE_B, SHARED_PASSWORD_HASH,
    OUTPUT_DIRS, ROLE_DISTRIBUTION
} from './config';
import {
    SqlFileWriter, randInt, pick, pickN, weightedPick,
    phaseTimestamp, formatMySQL, sqlStr, sqlBool, logProgress, getPhase, slugify
} from './helpers';
import {
    FIRST_NAMES, LAST_NAMES, COMPANIES, LOCATIONS, SKILLS,
    HEADLINE_TEMPLATES, ROLES, SPECIALTIES, EMAIL_DOMAINS, UNSPLASH_AVATARS
} from './data-pools';

// ═══════════════════════════════════════════════════════════
// USER GENERATOR — 60,000 unique users
// ═══════════════════════════════════════════════════════════

export interface GeneratedUser {
    id: number;
    username: string;
    email: string;
    role: string;
    location: string;
    skills: string[];
    joinedAt: Date;
    phase: 'A' | 'B';
    reputation: number;
}

/** Build a ui-avatars.com URL that never 404s */
function uiAvatar(firstName: string, lastName: string): string {
    const colors = ['0D8ABC', 'E91E63', '9C27B0', '673AB7', '3F51B5', '009688', 'FF5722', '795548', '607D8B', '4CAF50', 'FF9800', '2196F3', '00BCD4', '8BC34A', 'CDDC39'];
    const bg = pick(colors);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=${bg}&color=fff&size=400&bold=true&format=png`;
}

/** Build an Unsplash avatar URL */
function unsplashAvatar(photoId: string): string {
    return `https://images.unsplash.com/${photoId}?w=400&h=400&fit=crop&crop=face`;
}

/** Generate headline from template */
function generateHeadline(company: string): string {
    const template = pick(HEADLINE_TEMPLATES);
    const role = pick(ROLES);
    const specialty = pick(SPECIALTIES);
    return template
        .replace('{role}', role)
        .replace('{company}', company)
        .replace('{specialty}', specialty);
}

/** Generate unique username */
function generateUsername(firstName: string, lastName: string, index: number, usedUsernames: Set<string>): string {
    // Multiple patterns for variety
    const patterns = [
        () => `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
        () => `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
        () => `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
        () => `${firstName.toLowerCase()}${lastName.toLowerCase()}${randInt(1, 99)}`,
        () => `${firstName[0].toLowerCase()}${lastName.toLowerCase()}${randInt(10, 999)}`,
        () => `${firstName.toLowerCase()}${randInt(100, 9999)}`,
        () => `${lastName.toLowerCase()}.${firstName.toLowerCase()}`,
        () => `${firstName.toLowerCase()}_dev`,
        () => `${lastName.toLowerCase()}_${firstName[0].toLowerCase()}${randInt(1, 99)}`,
        () => `the_${firstName.toLowerCase()}`,
    ];

    let username = '';
    let attempts = 0;
    do {
        const pattern = attempts < patterns.length ? patterns[attempts] : patterns[randInt(0, patterns.length - 1)];
        username = pattern().replace(/[^a-z0-9._]/g, '').substring(0, 50);
        if (!username || username.length < 3) username = `user${index}`;
        attempts++;
        if (attempts > 20) username = `${firstName.toLowerCase()}${index}`;
    } while (usedUsernames.has(username));

    usedUsernames.add(username);
    return username;
}

/** Generate unique email */
function generateEmail(firstName: string, lastName: string, index: number, usedEmails: Set<string>): string {
    const domain = pick(EMAIL_DOMAINS);
    const patterns = [
        () => `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
        () => `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
        () => `${firstName[0].toLowerCase()}${lastName.toLowerCase()}@${domain}`,
        () => `${firstName.toLowerCase()}.${lastName[0].toLowerCase()}@${domain}`,
        () => `${firstName.toLowerCase()}${randInt(1, 999)}@${domain}`,
        () => `${lastName.toLowerCase()}.${firstName.toLowerCase()}@${domain}`,
        () => `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
    ];

    let email = '';
    let attempts = 0;
    do {
        const pattern = attempts < patterns.length ? patterns[attempts] : () => `${firstName.toLowerCase()}${index}@${domain}`;
        email = pattern().replace(/[^a-z0-9.@_-]/g, '');
        attempts++;
        if (attempts > 15) email = `user${index}@${domain}`;
    } while (usedEmails.has(email));

    usedEmails.add(email);
    return email;
}

/** Generate reputation with natural power-law distribution */
function generateReputation(): number {
    const rand = Math.random();
    if (rand < 0.50) return randInt(0, 50);       // 50% lurkers
    if (rand < 0.75) return randInt(51, 200);      // 25% casual
    if (rand < 0.90) return randInt(201, 800);     // 15% active
    if (rand < 0.97) return randInt(801, 2000);    // 7% power users
    return randInt(2001, 10000);                   // 3% top contributors
}

// --- MAIN EXPORT ---

export async function generateUsers(): Promise<GeneratedUser[]> {
    console.log('\n🧑 Generating users...');
    const users: GeneratedUser[] = [];
    const usedUsernames = new Set<string>();
    const usedEmails = new Set<string>();

    // Split counts by phase
    const phaseACount = Math.floor(TOTAL_USERS * PHASE_A.ratio);
    const phaseBCount = TOTAL_USERS - phaseACount;

    // Create writers for both phases
    const writerA = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseA.users}/users_phase_a.sql`,
        'users',
        ['username', 'email', 'password_hash', 'avatar_url', 'is_verified', 'role',
            'created_at', 'updated_at', 'headline', 'company', 'location',
            'github_handle', 'twitter_handle', 'skills', 'reputation_points']
    );
    const writerB = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseB.users}/users_phase_b.sql`,
        'users',
        ['username', 'email', 'password_hash', 'avatar_url', 'is_verified', 'role',
            'created_at', 'updated_at', 'headline', 'company', 'location',
            'github_handle', 'twitter_handle', 'skills', 'reputation_points']
    );

    const unsplashPool = [...UNSPLASH_AVATARS];
    let unsplashIndex = 0;

    for (let i = 0; i < TOTAL_USERS; i++) {
        const firstName = pick(FIRST_NAMES);
        const lastName = pick(LAST_NAMES);
        const username = generateUsername(firstName, lastName, i + 1, usedUsernames);
        const email = generateEmail(firstName, lastName, i + 1, usedEmails);

        // Determine phase
        const phase: 'A' | 'B' = i < phaseACount ? 'A' : 'B';
        const joinedAt = phaseTimestamp(phase);

        // Avatar: 10% get Unsplash (real faces), 90% get ui-avatars
        let avatarUrl: string;
        if (Math.random() < 0.10 && unsplashIndex < unsplashPool.length) {
            avatarUrl = unsplashAvatar(unsplashPool[unsplashIndex % unsplashPool.length]);
            unsplashIndex++;
        } else {
            avatarUrl = uiAvatar(firstName, lastName);
        }

        const role = weightedPick(ROLE_DISTRIBUTION as Record<string, number>);
        const isVerified = Math.random() < 0.15;
        const company = pick(COMPANIES);
        const location = pick(LOCATIONS);
        const headline = generateHeadline(company);
        const userSkills = pickN(SKILLS, randInt(1, 6));
        const skillsJson = JSON.stringify(userSkills);
        const reputation = generateReputation();

        // GitHub/Twitter handles — 60% have github, 40% have twitter
        const githubHandle = Math.random() < 0.60 ? username.replace(/[^a-z0-9-]/g, '') : null;
        const twitterHandle = Math.random() < 0.40 ? username.replace(/[^a-z0-9_]/g, '') : null;

        const joinedStr = formatMySQL(joinedAt);

        const values = [
            sqlStr(username),
            sqlStr(email),
            sqlStr(SHARED_PASSWORD_HASH),
            sqlStr(avatarUrl),
            sqlBool(isVerified),
            sqlStr(role),
            sqlStr(joinedStr),
            sqlStr(joinedStr),
            sqlStr(headline),
            sqlStr(company),
            sqlStr(location),
            sqlStr(githubHandle),
            sqlStr(twitterHandle),
            sqlStr(skillsJson),
            reputation.toString(),
        ];

        const writer = phase === 'A' ? writerA : writerB;
        writer.addRow(values);

        users.push({
            id: i + 1,
            username,
            email,
            role,
            location,
            skills: userSkills,
            joinedAt,
            phase,
            reputation,
        });

        logProgress('Users', i + 1, TOTAL_USERS);
    }

    await writerA.close();
    await writerB.close();
    console.log(`  ✅ Phase A: ${phaseACount.toLocaleString()} users | Phase B: ${phaseBCount.toLocaleString()} users`);
    return users;
}
