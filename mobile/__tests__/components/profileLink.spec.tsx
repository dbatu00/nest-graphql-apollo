import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { ProfileLink } from '../../components/common/ProfileLink';

jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
}));

describe('ProfileLink', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        (require('expo-router').useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
        (require('expo-router').usePathname as jest.Mock).mockReturnValue('/feed');
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('navigates to profile with delayed push and calls onNavigate', async () => {
        const onNavigate = jest.fn();
        const push = jest.fn();
        (require('expo-router').useRouter as jest.Mock).mockReturnValue({ push });

        const { getByText } = render(<ProfileLink username="alice" onNavigate={onNavigate} />);

        fireEvent.press(getByText('@alice'));

        expect(onNavigate).toHaveBeenCalled();

        await act(async () => {
            jest.advanceTimersByTime(120);
        });

        expect(push).toHaveBeenCalledWith({
            pathname: '/profile/[username]',
            params: { username: 'alice' },
        });
    });
});
