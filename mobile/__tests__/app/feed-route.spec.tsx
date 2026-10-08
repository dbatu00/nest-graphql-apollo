import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import Feed from '../../app/(app)/feed';
import { useActivities } from '../../hooks/useActivities';

jest.mock('../../hooks/useActivities', () => ({
    useActivities: jest.fn(),
}));

jest.mock('../../components/layout/PageShell', () => ({
    PageShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../components/layout/Header', () => ({
    Header: () => null,
}));

jest.mock('../../components/layout/AppHeaderActions', () => ({
    AppHeaderActions: () => null,
}));

let latestComposerProps: any = null;

jest.mock('../../components/feed/Composer', () => ({
    Composer: (props: any) => {
        latestComposerProps = props;
        const { Pressable, Text } = require('react-native');
        return (
            <>
                <Pressable onPress={() => props.onChange('  hello world  ')}>
                    <Text>set-composer</Text>
                </Pressable>
                <Pressable onPress={props.onPublish}>
                    <Text>publish-composer</Text>
                </Pressable>
            </>
        );
    },
}));

jest.mock('../../components/feed/ActivityList', () => ({
    ActivityList: () => null,
}));

describe('feed route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        latestComposerProps = null;

        (useActivities as jest.Mock).mockReturnValue({
            activities: [],
            visibleActivities: [],
            loading: false,
            error: null,
            refresh: jest.fn(),
            publishPost: jest.fn().mockResolvedValue(undefined),
            publishComment: jest.fn(),
            toggleFollow: jest.fn(),
            togglePostLike: jest.fn(),
            toggleCommentLike: jest.fn(),
            deletePost: jest.fn(),
            deleteComment: jest.fn(),
        });
    });

    it('renders and publishes trimmed composer content', async () => {
        const publishPost = jest.fn().mockResolvedValue(undefined);
        (useActivities as jest.Mock).mockReturnValue({
            activities: [],
            visibleActivities: [],
            loading: false,
            error: null,
            refresh: jest.fn(),
            publishPost,
            publishComment: jest.fn(),
            toggleFollow: jest.fn(),
            togglePostLike: jest.fn(),
            toggleCommentLike: jest.fn(),
            deletePost: jest.fn(),
            deleteComment: jest.fn(),
        });

        const { getByText } = render(<Feed />);

        fireEvent.press(getByText('set-composer'));
        fireEvent.press(getByText('publish-composer'));

        await waitFor(() => {
            expect(publishPost).toHaveBeenCalledWith('hello world');
        });

        expect(latestComposerProps).toBeTruthy();
    });
});
