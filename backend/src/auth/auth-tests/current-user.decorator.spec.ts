jest.mock('@nestjs/common', () => {
    const actual = jest.requireActual('@nestjs/common');
    return {
        ...actual,
        createParamDecorator: jest.fn((factory: any) => factory),
    };
});

jest.mock('@nestjs/graphql', () => ({
    GqlExecutionContext: {
        create: jest.fn(),
    },
}));

import { GqlExecutionContext } from '@nestjs/graphql';
import { CurrentUser } from '../current-user.decorator';

describe('CurrentUser decorator', () => {
    it('extracts req.user from GraphQL context', () => {
        const user = { id: 1, username: 'deniz' };
        (GqlExecutionContext.create as jest.Mock).mockReturnValue({
            getContext: () => ({ req: { user } }),
        });

        const result = (CurrentUser as any)(undefined, {});

        expect(result).toBe(user);
        expect(GqlExecutionContext.create).toHaveBeenCalled();
    });

    it('returns undefined when req.user is missing', () => {
        (GqlExecutionContext.create as jest.Mock).mockReturnValue({
            getContext: () => ({ req: {} }),
        });

        const result = (CurrentUser as any)(undefined, {});

        expect(result).toBeUndefined();
    });
});
