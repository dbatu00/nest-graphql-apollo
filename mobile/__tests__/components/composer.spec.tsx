import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { Composer } from '../../components/feed/Composer';

jest.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({ t: (key: string) => key }),
}));

describe('Composer', () => {
    it('updates value via onChange and publishes via button', () => {
        const onChange = jest.fn();
        const onPublish = jest.fn();

        const { getByPlaceholderText, getByText } = render(
            <Composer value="" onChange={onChange} onPublish={onPublish} />,
        );

        fireEvent.changeText(getByPlaceholderText('feed.composer.placeholder'), 'hello');
        fireEvent.press(getByText('feed.composer.publish'));

        expect(onChange).toHaveBeenCalledWith('hello');
        expect(onPublish).toHaveBeenCalled();
    });
});
