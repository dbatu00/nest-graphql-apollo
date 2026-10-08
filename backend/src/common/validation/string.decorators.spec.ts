import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

import { Trim, NotBlank } from './string.decorators';

describe('string validation decorators', () => {
    it('trims strings before validation', () => {
        class Example {
            @Trim()
            @NotBlank('value must not be blank')
            value!: string;
        }

        const dto = plainToClass(Example, { value: '  hello world  ' });
        const errors = validateSync(dto);

        expect(errors).toHaveLength(0);
        expect(dto.value).toBe('hello world');
    });

    it('rejects strings that are only whitespace', () => {
        class Example {
            @Trim()
            @NotBlank('value must not be blank')
            value!: string;
        }

        const dto = plainToClass(Example, { value: '   ' });
        const errors = validateSync(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].constraints?.matches).toBe('value must not be blank');
    });
});
