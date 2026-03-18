import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UsernameArgs } from '../graphql/args/username.args';
import { AddPostArgs } from '../../posts/dto/posts.args';
import { SignUpArgs } from '../../auth/dto/auth.args';
import { UpdateMyProfileArgs } from '../../users/dto/users.args';

function getPropertyErrors(errors: Awaited<ReturnType<typeof validate>>, property: string) {
    return errors.filter((error) => error.property === property);
}

describe('GraphQL args validation + transforms', () => {
    it('UsernameArgs trims username and validates non-empty', async () => {
        const valid = plainToInstance(UsernameArgs, { username: '  deniz  ' });
        const validErrors = await validate(valid);

        expect(valid.username).toBe('deniz');
        expect(validErrors).toHaveLength(0);

        const invalid = plainToInstance(UsernameArgs, { username: '   ' });
        const invalidErrors = await validate(invalid);

        expect(getPropertyErrors(invalidErrors, 'username').length).toBeGreaterThan(0);
    });

    it('AddPostArgs trims content and rejects blank content', async () => {
        const valid = plainToInstance(AddPostArgs, { content: '   hello world   ' });
        const validErrors = await validate(valid);

        expect(valid.content).toBe('hello world');
        expect(validErrors).toHaveLength(0);

        const invalid = plainToInstance(AddPostArgs, { content: '   ' });
        const invalidErrors = await validate(invalid);

        expect(getPropertyErrors(invalidErrors, 'content').length).toBeGreaterThan(0);
    });

    it('SignUpArgs trims identity fields before validation', async () => {
        const args = plainToInstance(SignUpArgs, {
            username: '  deniz  ',
            email: '  deniz@example.com  ',
            password: 'secret123',
        });

        const errors = await validate(args);

        expect(args.username).toBe('deniz');
        expect(args.email).toBe('deniz@example.com');
        expect(errors).toHaveLength(0);
    });

    it('UpdateMyProfileArgs allows empty avatar/cover values for clear operations', async () => {
        const args = plainToInstance(UpdateMyProfileArgs, {
            avatarUrl: '   ',
            coverUrl: '   ',
        });

        const errors = await validate(args);

        expect(args.avatarUrl).toBe('');
        expect(args.coverUrl).toBe('');
        expect(errors).toHaveLength(0);
    });

    it('UpdateMyProfileArgs still rejects invalid non-empty URLs', async () => {
        const args = plainToInstance(UpdateMyProfileArgs, {
            avatarUrl: 'not-a-valid-url',
        });

        const errors = await validate(args);

        expect(getPropertyErrors(errors, 'avatarUrl').length).toBeGreaterThan(0);
    });
});
