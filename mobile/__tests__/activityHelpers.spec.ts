import { resolveAvatarUri, getRelativeDateLabel } from '../utils/activityHelpers';

describe('activityHelpers', () => {
    it('uses a provided remote avatar URL when valid', () => {
        expect(resolveAvatarUri('Deniz', 'https://cdn.example.com/avatar.png')).toBe(
            'https://cdn.example.com/avatar.png',
        );
    });

    it('returns a generated placeholder for blank avatar values', () => {
        expect(resolveAvatarUri('Deniz', '   ')).toContain('ui-avatars.com');
    });

    it('formats recent timestamps into compact labels', () => {
        const now = Date.now();
        const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

        expect(getRelativeDateLabel(twoHoursAgo)).toBe('2h');
    });
});
