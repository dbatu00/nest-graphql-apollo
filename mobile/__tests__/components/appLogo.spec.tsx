import React from 'react';
import { render } from '@testing-library/react-native';

import { AppLogo } from '../../components/common/AppLogo';

describe('AppLogo', () => {
    it('renders base branding and optional subtitle', () => {
        const { getByText } = render(<AppLogo subtitle="Welcome" />);

        expect(getByText('BB')).toBeTruthy();
        expect(getByText('BookBook')).toBeTruthy();
        expect(getByText('Welcome')).toBeTruthy();
    });

    it('renders without subtitle', () => {
        const { getByText, queryByText } = render(<AppLogo />);

        expect(getByText('BookBook')).toBeTruthy();
        expect(queryByText('Welcome')).toBeNull();
    });
});
