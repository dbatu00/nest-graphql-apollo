import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UsernameArgs } from './username.args';

describe('UsernameArgs validation', () => {
    it('accepts a valid username and keeps trimmed value', () => {
        const dto = plainToClass(UsernameArgs, { username: '  alice  ' });
        const errors = validateSync(dto);

        expect(errors).toHaveLength(0);
        expect(dto.username).toBe('alice');
    });

    it('rejects whitespace-only username', () => {
        const dto = plainToClass(UsernameArgs, { username: '   ' });
        const errors = validateSync(dto);

        expect(errors.some((err) => err.property === 'username')).toBe(true);
    });
});
