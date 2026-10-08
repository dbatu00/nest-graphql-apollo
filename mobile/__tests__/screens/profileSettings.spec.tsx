import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ProfileSettingsScreen from '../../app/(app)/profile/[username]/settings';
import { useAuth } from '@/hooks/useAuth';
import { useProfileMeta } from '@/hooks/useProfileMeta';
import {
    changeMyEmail,
    changeMyPassword,
    deleteMyAccount,
    isEmailUsed,
    updateMyProfile,
} from '@/graphql/client';

jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
}));

jest.mock('expo-linear-gradient', () => ({
    LinearGradient: () => null,
}));

jest.mock('@/hooks/useAuth', () => ({
    useAuth: jest.fn(),
}));

jest.mock('@/hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}));

jest.mock('@/hooks/useProfileMeta', () => ({
    useProfileMeta: jest.fn(),
}));

jest.mock('@/graphql/client', () => ({
    changeMyEmail: jest.fn(),
    changeMyPassword: jest.fn(),
    deleteMyAccount: jest.fn(),
    isEmailUsed: jest.fn(),
    updateMyProfile: jest.fn(),
}));

jest.mock('@/components/layout/PageShell', () => ({
    PageShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/layout/Header', () => ({
    Header: () => null,
}));

jest.mock('@/components/layout/AppHeaderActions', () => ({
    AppHeaderActions: () => null,
}));

describe('profile settings screen', () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    const refreshProfileMeta = jest.fn().mockResolvedValue(undefined);
    const replace = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (require('expo-router').useRouter as jest.Mock).mockReturnValue({ replace });

        (useAuth as jest.Mock).mockReturnValue({ logout });

        (useProfileMeta as jest.Mock).mockReturnValue({
            loading: false,
            refreshProfileMeta,
            profileMeta: {
                id: 1,
                username: 'alice',
                displayName: 'Alice',
                bio: 'Old bio',
                avatarUrl: 'https://img/avatar.png',
                coverUrl: 'https://img/cover.png',
                email: 'alice@example.com',
            },
        });

        (isEmailUsed as jest.Mock).mockResolvedValue(false);
        (changeMyEmail as jest.Mock).mockResolvedValue(true);
        (changeMyPassword as jest.Mock).mockResolvedValue(true);
        (deleteMyAccount as jest.Mock).mockResolvedValue(true);
        (updateMyProfile as jest.Mock).mockResolvedValue(true);
    });

    it('shows no-changes message when saving unchanged about form', async () => {
        const { getByText } = render(<ProfileSettingsScreen />);

        fireEvent.press(getByText('settings.about.saveChanges').parent);

        await waitFor(() => {
            expect(getByText('settings.about.noChanges')).toBeTruthy();
        });

        expect(updateMyProfile).not.toHaveBeenCalled();
    });

    it('validates empty email change form in account tab', async () => {
        const { getByText } = render(<ProfileSettingsScreen />);

        fireEvent.press(getByText('settings.tab.account').parent);
        fireEvent.press(getByText('settings.account.changeEmail').parent);

        await waitFor(() => {
            expect(getByText('settings.error.email.fillFields')).toBeTruthy();
        });

        expect(changeMyEmail).not.toHaveBeenCalled();
    });

    it('validates delete account minimum password length', async () => {
        const { getByText, getAllByPlaceholderText } = render(<ProfileSettingsScreen />);

        fireEvent.press(getByText('settings.tab.account').parent);

        const currentPasswordFields = getAllByPlaceholderText('settings.account.currentPasswordPlaceholder');
        const deletePasswordField = currentPasswordFields[currentPasswordFields.length - 1];
        fireEvent.changeText(deletePasswordField, 'short');
        fireEvent.press(getByText('settings.account.deleteButton'));

        await waitFor(() => {
            expect(getByText('settings.error.deletePasswordLength')).toBeTruthy();
        });

        expect(deleteMyAccount).not.toHaveBeenCalled();
    });

});
