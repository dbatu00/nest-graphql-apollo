jest.mock('@nestjs/common', () => ({
    createParamDecorator: jest.fn((factory: unknown) => factory),
}));

jest.mock('@nestjs/graphql', () => ({
    GqlExecutionContext: {
        create: jest.fn(),
    },
}));

import { GqlExecutionContext } from '@nestjs/graphql';

import { CurrentUser } from './current-user.decorator';

describe('CurrentUser decorator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('extracts req.user from graphql context', () => {
        const user = { id: 7, username: 'alice' };

        (GqlExecutionContext.create as jest.Mock).mockReturnValue({
            getContext: () => ({ req: { user } }),
        });

        const executionContext = {} as any;
        const result = (CurrentUser as any)(undefined, executionContext);

        expect(result).toEqual(user);
    });
});
