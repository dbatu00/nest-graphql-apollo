import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

export function Trim() {
    return Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
}

export function NotBlank(message: string) {
    return Matches(/\S/, { message });
}
