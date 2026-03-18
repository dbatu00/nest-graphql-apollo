import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';
import { NotBlank, Trim } from '../../validation/string.decorators';

@ArgsType()
export class UsernameArgs {
    @Field(() => String)
    @Trim()
    @IsString()
    @MinLength(1)
    @NotBlank('username must not be empty')
    username: string;
}