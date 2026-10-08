import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { UserSettingsButton } from '../../components/common/SettingsButton';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
}));

jest.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({ t: (key: string) => key }),
}));

describe('UserSettingsButton', () => {
    it('uses explicit label and triggers onPress', () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <UserSettingsButton onPress={onPress} label="Custom Label" />,
        );

        fireEvent.press(getByText('Custom Label'));

        expect(onPress).toHaveBeenCalled();
    });

    it('falls back to translated settings label', () => {
        const { getByText } = render(<UserSettingsButton onPress={() => undefined} />);

        expect(getByText('common.settings')).toBeTruthy();
    });
});
