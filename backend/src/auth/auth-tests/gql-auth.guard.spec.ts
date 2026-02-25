jest.mock('@nestjs/graphql', () => ({
    GqlExecutionContext: {
        create: jest.fn(),
    },
}));

import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlAuthGuard } from '../security/gql-auth.guard';

describe('GqlAuthGuard', () => {
    it('returns req object from GraphQL context', () => {
        const req = { headers: { authorization: 'Bearer x' } };
        (GqlExecutionContext.create as jest.Mock).mockReturnValue({
            getContext: () => ({ req }),
        });

        const guard = new GqlAuthGuard();
        const request = guard.getRequest({} as any);

        expect(request).toBe(req);
        expect(GqlExecutionContext.create).toHaveBeenCalled();
    });
});
