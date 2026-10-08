import React from 'react';
import { render } from '@testing-library/react-native';

import { UserList } from '../../components/user/UserList';

jest.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}));

jest.mock('../../components/user/UserRow', () => ({
    UserRow: jest.fn(() => null),
}));

describe('UserList', () => {
    const makeFollow = (overrides: Partial<any> = {}) => ({
        users: [],
        loading: false,
        error: null,
        toggleFollow: jest.fn(),
        refresh: jest.fn(),
        ...overrides,
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows empty state when there are no users', () => {
        const { getByText } = render(
            <UserList follow={makeFollow()} />,
        );

        expect(getByText('feed.empty')).toBeTruthy();
    });

    it('shows error state when follow source has an error', () => {
        const { getByText } = render(
            <UserList follow={makeFollow({ error: 'boom' })} />,
        );

        expect(getByText('boom')).toBeTruthy();
    });

    it('renders one UserRow per user and forwards list props', () => {
        const users = [
            { id: 1, username: 'alice', displayName: 'Alice', followedByMe: false },
            { id: 2, username: 'bob', displayName: 'Bob', followedByMe: true },
        ];

        const toggleFollow = jest.fn();
        render(
            <UserList
                follow={makeFollow({ users, toggleFollow })}
                currentUserId={99}
                isCompact
            />,
        );

        const { UserRow } = require('../../components/user/UserRow');
        expect(UserRow).toHaveBeenCalledTimes(2);
        expect(UserRow).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                user: expect.objectContaining({ username: 'alice' }),
                currentUserId: 99,
                isCompact: true,
                onToggleFollow: toggleFollow,
            }),
            undefined,
        );
    });
});
