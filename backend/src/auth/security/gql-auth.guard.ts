// Passport JWT guard adapted for GraphQL requests.
import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GqlExecutionContext } from "@nestjs/graphql";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class GqlAuthGuard extends AuthGuard("jwt") {
    getRequest(context: ExecutionContext) {
        const ctx = GqlExecutionContext.create(context);
        return ctx.getContext().req;
    }
}

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
    protected getRequestResponse(context: ExecutionContext) {
        if (context.getType<'graphql'>() === 'graphql') {
            const gqlContext = GqlExecutionContext.create(context).getContext();
            return { req: gqlContext.req, res: gqlContext.res };
        }

        const httpContext = context.switchToHttp();
        return { req: httpContext.getRequest(), res: httpContext.getResponse() };
    }
}
