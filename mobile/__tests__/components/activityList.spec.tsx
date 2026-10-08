import React from 'react';
import { render } from '@testing-library/react-native';

import { ActivityList } from '../../components/feed/ActivityList';

jest.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}));

jest.mock('../../components/feed/ActivityRow', () => ({
    ActivityRow: jest.fn(() => null),
}));

describe('ActivityList', () => {
    const makeFeed = (overrides: Partial<any> = {}) => ({
        activities: [],
        visibleActivities: undefined,
        loading: false,
        error: null,
        refresh: jest.fn(),
        toggleFollow: jest.fn(),
        deletePost: jest.fn(),
        togglePostLike: jest.fn(),
        publishPost: jest.fn(),
        publishComment: jest.fn(),
        deleteComment: jest.fn(),
        toggleCommentLike: jest.fn(),
        ...overrides,
    });

    const activityA = {
        id: 1,
        type: 'post',
        createdAt: '2026-01-01T00:00:00.000Z',
        active: true,
        actor: { id: 1, username: 'alice', displayName: 'Alice', avatarUrl: '' },
        targetPost: {
            id: 101,
            content: 'first',
            createdAt: '2026-01-01T00:00:00.000Z',
            user: { id: 1, username: 'alice', displayName: 'Alice', avatarUrl: '', followedByMe: false },
            likedByMe: false,
            likesCount: 0,
            comments: [],
        },
    };

    const activityB = {
        ...activityA,
        id: 2,
        targetPost: {
            ...activityA.targetPost,
            id: 102,
            content: 'second',
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows empty text when not loading and there are no activities', () => {
        const { getByText } = render(<ActivityList feed={makeFeed()} />);

        expect(getByText('feed.empty')).toBeTruthy();
    });

    it('renders error text when feed has error', () => {
        const { getByText } = render(<ActivityList feed={makeFeed({ error: 'boom' })} />);

        expect(getByText('boom')).toBeTruthy();
    });

    it('renders visibleActivities by default when present', () => {
        render(
            <ActivityList
                feed={makeFeed({
                    activities: [activityA, activityB],
                    visibleActivities: [activityB],
                })}
            />,
        );

        const { ActivityRow } = require('../../components/feed/ActivityRow');
        expect(ActivityRow).toHaveBeenCalledTimes(1);
        expect(ActivityRow).toHaveBeenCalledWith(
            expect.objectContaining({ activity: expect.objectContaining({ id: 2 }) }),
            undefined,
        );
    });

    it('uses full activities then applies filter when filter is provided', () => {
        render(
            <ActivityList
                feed={makeFeed({
                    activities: [activityA, activityB],
                    visibleActivities: [activityB],
                })}
                filter={(activity) => activity.id === 1}
            />,
        );

        const { ActivityRow } = require('../../components/feed/ActivityRow');
        expect(ActivityRow).toHaveBeenCalledTimes(1);
        expect(ActivityRow).toHaveBeenCalledWith(
            expect.objectContaining({ activity: expect.objectContaining({ id: 1 }) }),
            undefined,
        );
    });
});
