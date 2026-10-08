import React from 'react';
import { render } from '@testing-library/react-native';

import Index from '../../app/index';

describe('index route', () => {
    it('renders without crashing', () => {
        const { toJSON } = render(<Index />);
        expect(toJSON()).toBeNull();
    });
});
