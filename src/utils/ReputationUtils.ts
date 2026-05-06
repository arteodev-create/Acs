export type UserRank = 'Junior' | 'Contributor' | 'Guru' | 'Admin' | 'Founder';

export class ReputationUtils {
    static getRank(points: number, role: string = 'user'): UserRank {
        if (role === 'admin') return 'Admin';
        if (role === 'founder') return 'Founder';

        if (points >= 1000) return 'Guru';
        if (points >= 200) return 'Contributor';
        return 'Junior';
    }

    static getRankBadgeColor(rank: UserRank): string {
        switch (rank) {
            case 'Founder': return 'bg-red-600 text-white';
            case 'Admin': return 'bg-purple-600 text-white';
            case 'Guru': return 'bg-blue-600 text-white';
            case 'Contributor': return 'bg-green-600 text-white';
            default: return 'bg-gray-200 text-gray-700';
        }
    }
}
