import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@ArgsType()
export class UsernameArgs {
    @Field(() => String)
    @IsString()
    @MinLength(1)
    username: string;
}
