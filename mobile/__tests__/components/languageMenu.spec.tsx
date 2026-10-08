import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';

import { HeaderLanguageMenu } from '../../components/common/LanguageMenu';
import { useI18n } from '../../hooks/useI18n';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
}));

jest.mock('../../hooks/useI18n', () => ({
    useI18n: jest.fn(),
}));

describe('HeaderLanguageMenu', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useI18n as jest.Mock).mockReturnValue({
            language: 'en',
            setLanguage: jest.fn().mockResolvedValue(undefined),
        });
    });

    it('opens dropdown and changes language', async () => {
        const setLanguage = jest.fn().mockResolvedValue(undefined);
        (useI18n as jest.Mock).mockReturnValue({ language: 'en', setLanguage });

        const { UNSAFE_getAllByType, getByText } = render(<HeaderLanguageMenu />);

        fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
        fireEvent.press(getByText('Türkçe'));

        await waitFor(() => {
            expect(setLanguage).toHaveBeenCalledWith('tr');
        });
    });
});
