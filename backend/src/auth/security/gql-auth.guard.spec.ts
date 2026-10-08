import { GqlExecutionContext } from '@nestjs/graphql';

import { GqlAuthGuard, GqlThrottlerGuard } from './gql-auth.guard';

jest.mock('@nestjs/graphql', () => ({
    GqlExecutionContext: {
        create: jest.fn(),
    },
}));

describe('gql auth guards', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GqlAuthGuard.getRequest returns graphql req object', () => {
        const req = { user: { id: 1 } };
        (GqlExecutionContext.create as jest.Mock).mockReturnValue({
            getContext: () => ({ req }),
        });

        const guard = new GqlAuthGuard();
        const context = {} as any;

        expect(guard.getRequest(context)).toBe(req);
    });

    it('GqlThrottlerGuard.getRequestResponse returns graphql req/res in graphql context', () => {
        const req = { ip: '127.0.0.1' };
        const res = { statusCode: 200 };
        (GqlExecutionContext.create as jest.Mock).mockReturnValue({
            getContext: () => ({ req, res }),
        });

        const guard = new GqlThrottlerGuard();
        const context = {
            getType: jest.fn().mockReturnValue('graphql'),
            switchToHttp: jest.fn(),
        } as any;

        expect((guard as any).getRequestResponse(context)).toEqual({ req, res });
    });

    it('GqlThrottlerGuard.getRequestResponse falls back to http context for non-graphql', () => {
        const req = { ip: '127.0.0.1' };
        const res = { statusCode: 200 };

        const guard = new GqlThrottlerGuard();
        const context = {
            getType: jest.fn().mockReturnValue('http'),
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: () => req,
                getResponse: () => res,
            }),
        } as any;

        expect((guard as any).getRequestResponse(context)).toEqual({ req, res });
    });
});
