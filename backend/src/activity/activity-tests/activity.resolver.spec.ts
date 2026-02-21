import { ActivityResolver } from '../activity.resolver';

describe('ActivityResolver', () => {
    const activityService = {
        getActivityFeed: jest.fn(),
    };

    let resolver: ActivityResolver;

    beforeEach(() => {
        jest.clearAllMocks();
        resolver = new ActivityResolver(activityService as any);
    });

    it('throws when authenticated user is missing', async () => {
        expect(() => resolver.feed(undefined, undefined, undefined)).toThrow(
            'Authenticated user not found',
        );
        expect(activityService.getActivityFeed).not.toHaveBeenCalled();
    });

    it('delegates to activity service when user exists', async () => {
        const rows = [{ id: 1 }];
        activityService.getActivityFeed.mockResolvedValue(rows);

        await expect(
            resolver.feed('deniz', ['post', 'like'], { id: 1 } as any),
        ).resolves.toBe(rows as any);
        expect(activityService.getActivityFeed).toHaveBeenCalledWith('deniz', ['post', 'like']);
    });

    it('passes undefined filters through when omitted', async () => {
        const rows = [{ id: 2 }];
        activityService.getActivityFeed.mockResolvedValue(rows);

        await expect(
            resolver.feed(undefined, undefined, { id: 1 } as any),
        ).resolves.toBe(rows as any);
        expect(activityService.getActivityFeed).toHaveBeenCalledWith(undefined, undefined);
    });

    it('passes empty types array through unchanged', async () => {
        const rows = [{ id: 3 }];
        activityService.getActivityFeed.mockResolvedValue(rows);

        await expect(
            resolver.feed('deniz', [], { id: 1 } as any),
        ).resolves.toBe(rows as any);
        expect(activityService.getActivityFeed).toHaveBeenCalledWith('deniz', []);
    });

    it('propagates activity service errors', async () => {
        activityService.getActivityFeed.mockRejectedValue(new Error('feed failed'));

        await expect(
            resolver.feed('deniz', ['post'], { id: 1 } as any),
        ).rejects.toThrow('feed failed');
    });
});
