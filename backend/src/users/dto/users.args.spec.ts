import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UpdateMyProfileArgs } from './users.args';

describe('UpdateMyProfileArgs validation', () => {
    it('trims display fields and allows blank avatar/cover strings', () => {
        const dto = plainToClass(UpdateMyProfileArgs, {
            displayName: '  Alice  ',
            bio: '  about  ',
            avatarUrl: '   ',
            coverUrl: '',
        });

        const errors = validateSync(dto);

        expect(errors).toHaveLength(0);
        expect(dto.displayName).toBe('Alice');
        expect(dto.bio).toBe('about');
        expect(dto.avatarUrl).toBe('');
        expect(dto.coverUrl).toBe('');
    });

    it('rejects invalid avatarUrl when non-empty', () => {
        const dto = plainToClass(UpdateMyProfileArgs, {
            avatarUrl: 'http:// bad',
        });

        const errors = validateSync(dto);

        expect(errors.some((err) => err.property === 'avatarUrl')).toBe(true);
    });
});
