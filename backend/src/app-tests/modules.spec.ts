import { MODULE_METADATA } from '@nestjs/common/constants';

import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { UsersResolver } from '../users/users.resolver';

import { PostsModule } from '../posts/posts.module';
import { PostsService } from '../posts/posts.service';
import { PostsResolver } from '../posts/posts.resolver';

import { FollowsModule } from '../follows/follows.module';
import { FollowsService } from '../follows/follows.service';
import { FollowsResolver } from '../follows/follows.resolver';

import { ActivityModule } from '../activity/activity.module';
import { ActivityService } from '../activity/activity.service';
import { ActivityResolver } from '../activity/activity.resolver';

import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { AuthResolver } from '../auth/auth.resolver';
import { JwtStrategy } from '../auth/security/jwt.strategy';

describe('Feature Modules Metadata', () => {
    it('UsersModule provides and exports UsersService', () => {
        const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, UsersModule) ?? [];
        const exportsMeta = Reflect.getMetadata(MODULE_METADATA.EXPORTS, UsersModule) ?? [];

        expect(providers).toContain(UsersService);
        expect(providers).toContain(UsersResolver);
        expect(exportsMeta).toContain(UsersService);
    });

    it('PostsModule provides resolver + service', () => {
        const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, PostsModule) ?? [];

        expect(providers).toContain(PostsService);
        expect(providers).toContain(PostsResolver);
    });

    it('FollowsModule provides resolver + service', () => {
        const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, FollowsModule) ?? [];

        expect(providers).toContain(FollowsService);
        expect(providers).toContain(FollowsResolver);
    });

    it('ActivityModule provides and exports ActivityService', () => {
        const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ActivityModule) ?? [];
        const exportsMeta = Reflect.getMetadata(MODULE_METADATA.EXPORTS, ActivityModule) ?? [];

        expect(providers).toContain(ActivityService);
        expect(providers).toContain(ActivityResolver);
        expect(exportsMeta).toContain(ActivityService);
    });

    it('AuthModule provides auth resolver/service/strategy and exports AuthService', () => {
        const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthModule) ?? [];
        const exportsMeta = Reflect.getMetadata(MODULE_METADATA.EXPORTS, AuthModule) ?? [];

        expect(providers).toContain(AuthService);
        expect(providers).toContain(AuthResolver);
        expect(providers).toContain(JwtStrategy);
        expect(exportsMeta).toContain(AuthService);
    });
});
