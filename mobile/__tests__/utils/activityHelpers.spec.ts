import { resolveAvatarUri, getRelativeDateLabel } from '../../utils/activityHelpers';

describe('activityHelpers', () => {
    it('uses a provided remote avatar URL when valid', () => {
        expect(resolveAvatarUri('Deniz', 'https://cdn.example.com/avatar.png')).toBe(
            'https://cdn.example.com/avatar.png',
        );
    });

    it('returns a generated placeholder for blank avatar values', () => {
        expect(resolveAvatarUri('Deniz', '   ')).toContain('ui-avatars.com');
    });

    it('accepts uppercase HTTP protocol in avatar URL', () => {
        expect(resolveAvatarUri('Deniz', 'HTTPS://cdn.example.com/avatar.png')).toBe(
            'HTTPS://cdn.example.com/avatar.png',
        );
    });

    it('falls back to placeholder when avatar URL is not absolute http(s)', () => {
        expect(resolveAvatarUri('Deniz', '/avatars/deniz.png')).toContain('ui-avatars.com');
    });

    it('encodes label and keeps custom size in generated placeholder URL', () => {
        const uri = resolveAvatarUri('Deniz Kaya', '', 256);

        expect(uri).toContain('name=Deniz%20Kaya');
        expect(uri).toContain('size=256');
    });

    it('formats recent timestamps into compact labels', () => {
        const now = Date.now();
        const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

        expect(getRelativeDateLabel(twoHoursAgo)).toBe('2h');
    });

    it('returns empty label for invalid date strings', () => {
        expect(getRelativeDateLabel('not-a-date')).toBe('');
    });

    it('returns at least 1m for very recent timestamps', () => {
        const now = Date.now();
        const tenSecondsAgo = new Date(now - 10 * 1000).toISOString();

        expect(getRelativeDateLabel(tenSecondsAgo)).toBe('1m');
    });

    it('formats sub-hour timestamps in minutes', () => {
        const now = Date.now();
        const fiftyNineMinutesAgo = new Date(now - 59 * 60 * 1000).toISOString();

        expect(getRelativeDateLabel(fiftyNineMinutesAgo)).toBe('59m');
    });

    it('formats sub-day timestamps in hours', () => {
        const now = Date.now();
        const twentyThreeHoursAgo = new Date(now - 23 * 60 * 60 * 1000).toISOString();

        expect(getRelativeDateLabel(twentyThreeHoursAgo)).toBe('23h');
    });

    it('formats sub-week timestamps in days', () => {
        const now = Date.now();
        const sixDaysAgo = new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString();

        expect(getRelativeDateLabel(sixDaysAgo)).toBe('6d');
    });

    it('formats sub-month timestamps in weeks', () => {
        const now = Date.now();
        const fifteenDaysAgo = new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString();

        expect(getRelativeDateLabel(fifteenDaysAgo)).toBe('2w');
    });

    it('formats old timestamps as month label when under one year', () => {
        const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-09-01T00:00:00.000Z').getTime());

        expect(getRelativeDateLabel('2026-01-15T00:00:00.000Z')).toBe('Jan');

        nowSpy.mockRestore();
    });

    it('formats very old timestamps as year label', () => {
        const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-09-01T00:00:00.000Z').getTime());

        expect(getRelativeDateLabel('2024-01-15T00:00:00.000Z')).toBe('2024');

        nowSpy.mockRestore();
    });
});
