import { ArgsType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Trim } from '../../common/validation/string.decorators';

@ArgsType()
export class SignUpArgs {
    @Field(() => String)
    @Trim()
    @IsString()
    @MinLength(1)
    username: string;

    @Field(() => String)
    @Trim()
    @IsEmail()
    email: string;

    @Field(() => String)
    @IsString()
    @MinLength(8)
    password: string;
}

@ArgsType()
export class LoginArgs {
    @Field(() => String)
    @Trim()
    @IsString()
    @MinLength(1)
    identifier: string;

    @Field(() => String)
    @IsString()
    @MinLength(8)
    password: string;
}

@ArgsType()
export class ChangeMyPasswordArgs {
    @Field(() => String)
    @IsString()
    @MinLength(8)
    currentPassword: string;

    @Field(() => String)
    @IsString()
    @MinLength(8)
    newPassword: string;
}

@ArgsType()
export class ChangeMyEmailArgs {
    @Field(() => String)
    @IsString()
    @MinLength(8)
    currentPassword: string;

    @Field(() => String)
    @Trim()
    @IsEmail()
    newEmail: string;
}

@ArgsType()
export class IsEmailUsedArgs {
    @Field(() => String)
    @Trim()
    @IsEmail()
    email: string;
}
