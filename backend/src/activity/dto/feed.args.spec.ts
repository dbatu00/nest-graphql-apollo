import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

import { FeedArgs } from './feed.args';

describe('FeedArgs validation', () => {
    it('accepts valid username and activity type array', () => {
        const dto = plainToClass(FeedArgs, {
            username: 'alice',
            types: ['post', 'like'],
        });

        const errors = validateSync(dto);

        expect(errors).toHaveLength(0);
    });

    it('rejects invalid activity types', () => {
        const dto = plainToClass(FeedArgs, {
            username: 'alice',
            types: ['post', 'invalid-type'],
        });

        const errors = validateSync(dto);

        expect(errors.some((err) => err.property === 'types')).toBe(true);
    });
});
