import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { FeedLogoutButton } from '../../components/common/LogoutButton';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
}));

jest.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({ t: (key: string) => key }),
}));

describe('FeedLogoutButton', () => {
    it('renders label and triggers onPress', () => {
        const onPress = jest.fn();
        const { getByText } = render(<FeedLogoutButton onPress={onPress} />);

        fireEvent.press(getByText('common.logout'));

        expect(onPress).toHaveBeenCalled();
    });

    it('hides text in compact mode', () => {
        const { queryByText } = render(<FeedLogoutButton onPress={() => undefined} hideText />);

        expect(queryByText('common.logout')).toBeNull();
    });
});
