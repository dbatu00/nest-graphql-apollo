import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

import {
    ChangeMyEmailArgs,
    DeleteMyAccountArgs,
    IsEmailUsedArgs,
    LoginArgs,
    SignUpArgs,
} from './auth.args';

describe('auth args validation', () => {
    it('trims SignUpArgs username/email and validates a valid payload', () => {
        const dto = plainToClass(SignUpArgs, {
            username: '  alice  ',
            email: '  alice@example.com  ',
            password: 'password123',
        });

        const errors = validateSync(dto);

        expect(errors).toHaveLength(0);
        expect(dto.username).toBe('alice');
        expect(dto.email).toBe('alice@example.com');
    });

    it('rejects invalid SignUpArgs email', () => {
        const dto = plainToClass(SignUpArgs, {
            username: 'alice',
            email: 'not-an-email',
            password: 'password123',
        });

        const errors = validateSync(dto);

        expect(errors.some((err) => err.property === 'email')).toBe(true);
    });

    it('trims LoginArgs identifier and rejects blank identifier', () => {
        const dto = plainToClass(LoginArgs, {
            identifier: '   ',
            password: 'password123',
        });

        const errors = validateSync(dto);

        expect(dto.identifier).toBe('');
        expect(errors.some((err) => err.property === 'identifier')).toBe(true);
    });

    it('trims ChangeMyEmailArgs newEmail', () => {
        const dto = plainToClass(ChangeMyEmailArgs, {
            currentPassword: 'password123',
            newEmail: '  user@example.com  ',
        });

        const errors = validateSync(dto);

        expect(errors).toHaveLength(0);
        expect(dto.newEmail).toBe('user@example.com');
    });

    it('rejects short DeleteMyAccountArgs password', () => {
        const dto = plainToClass(DeleteMyAccountArgs, {
            currentPassword: 'short',
        });

        const errors = validateSync(dto);

        expect(errors.some((err) => err.property === 'currentPassword')).toBe(true);
    });

    it('trims IsEmailUsedArgs email and validates it', () => {
        const dto = plainToClass(IsEmailUsedArgs, {
            email: '  test@example.com  ',
        });

        const errors = validateSync(dto);

        expect(errors).toHaveLength(0);
        expect(dto.email).toBe('test@example.com');
    });
});
