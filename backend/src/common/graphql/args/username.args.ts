import { ArgsType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsString, Matches, MinLength } from 'class-validator';

@ArgsType()
export class UsernameArgs {
    @Field(() => String)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @MinLength(1)
    @Matches(/\S/, { message: 'username must not be empty' })
    username: string;
}