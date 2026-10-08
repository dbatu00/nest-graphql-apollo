import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { UserRow } from '../../components/user/UserRow';

jest.mock('@expo/vector-icons', () => ({
    MaterialCommunityIcons: () => null,
}));

jest.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}));

jest.mock('../../components/common/ProfileLink', () => ({
    ProfileLink: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('UserRow', () => {
    it('calls onToggleFollow with next state for non-self user', () => {
        const onToggleFollow = jest.fn();

        const { getByText } = render(
            <UserRow
                user={{ id: 2, username: 'alice', displayName: 'Alice', followedByMe: false }}
                currentUserId={1}
                onToggleFollow={onToggleFollow}
            />,
        );

        fireEvent.press(getByText('user.follow'));

        expect(onToggleFollow).toHaveBeenCalledWith('alice', true);
    });

    it('calls onDelete for self row when delete action is available', () => {
        const onDelete = jest.fn();

        const { UNSAFE_getByType } = render(
            <UserRow
                user={{ id: 1, username: 'me', displayName: 'Me' }}
                currentUserId={1}
                onDelete={onDelete}
            />,
        );

        const pressable = UNSAFE_getByType(require('react-native').Pressable);
        fireEvent.press(pressable);

        expect(onDelete).toHaveBeenCalledWith(1);
    });
});
