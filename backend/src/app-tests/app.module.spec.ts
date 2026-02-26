import { MODULE_METADATA } from '@nestjs/common/constants';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { AuthModule } from '../auth/auth.module';
import { FollowsModule } from '../follows/follows.module';
import { ActivityModule } from '../activity/activity.module';
import { ActivityResolver } from '../activity/activity.resolver';
import { AuthService } from '../auth/auth.service';
import { MODULE_METADATA as MODULE_KEYS } from '@nestjs/common/constants';

describe('AppModule', () => {
    it('includes domain modules in imports', () => {
        const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) ?? [];

        expect(imports).toContain(UsersModule);
        expect(imports).toContain(PostsModule);
        expect(imports).toContain(AuthModule);
        expect(imports).toContain(FollowsModule);
        expect(imports).toContain(ActivityModule);
    });

    it('registers ActivityResolver provider', () => {
        const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule) ?? [];
        expect(providers).toContain(ActivityResolver);
    });

    it('keeps TypeORM options shape explicit in module wiring', () => {
        const source = readFileSync(join(__dirname, '..', 'app.module.ts'), 'utf8');

        expect(source).toContain("TypeOrmModule.forRootAsync({");
        expect(source).toContain("type: 'postgres'");
        expect(source).toContain("configService.getOrThrow<string>('DB_HOST')");
        expect(source).toContain("configService.getOrThrow<number>('DB_PORT')");
        expect(source).toContain("const synchronize = configService.getOrThrow<boolean>('DB_SYNCHRONIZE')");
        expect(source).toContain("synchronize,");
        expect(source).toContain('validate: validateEnvironment');
    });

    it('keeps AuthModule JWT registration options explicit', () => {
        const authSource = readFileSync(join(__dirname, '..', 'auth', 'auth.module.ts'), 'utf8');

        expect(authSource).toContain('JwtModule.registerAsync({');
        expect(authSource).toContain('secret: configService.getOrThrow<string>("JWT_SECRET")');
        expect(authSource).toContain('configService.get<string>("JWT_EXPIRES_IN") ?? "15m"');

        const authExports = Reflect.getMetadata(MODULE_KEYS.EXPORTS, AuthModule) ?? [];
        expect(authExports).toContain(AuthService);
    });
});
