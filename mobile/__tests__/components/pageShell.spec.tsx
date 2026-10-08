import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { PageShell } from '../../components/layout/PageShell';

describe('PageShell', () => {
    it('renders header and children content', () => {
        const { getByText } = render(
            <PageShell header={<Text>Header Area</Text>}>
                <Text>Body Content</Text>
            </PageShell>,
        );

        expect(getByText('Header Area')).toBeTruthy();
        expect(getByText('Body Content')).toBeTruthy();
    });
});
