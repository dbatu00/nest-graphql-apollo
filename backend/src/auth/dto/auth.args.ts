import { ArgsType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../common/validation/string.decorators';
import {
    EMAIL_MAX_LENGTH,
    LOGIN_IDENTIFIER_MAX_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from '../../common/validation/input-limits';

@ArgsType()
export class SignUpArgs {
    @Field(() => String)
    @Trim()
    @IsString()
    @MinLength(USERNAME_MIN_LENGTH)
    @MaxLength(USERNAME_MAX_LENGTH)
    username: string;

    @Field(() => String)
    @Trim()
    @IsEmail()
    @MaxLength(EMAIL_MAX_LENGTH)
    email: string;

    @Field(() => String)
    @IsString()
    @MinLength(PASSWORD_MIN_LENGTH)
    @MaxLength(PASSWORD_MAX_LENGTH)
    password: string;
}

@ArgsType()
export class LoginArgs {
    @Field(() => String)
    @Trim()
    @IsString()
    @MinLength(USERNAME_MIN_LENGTH)
    @MaxLength(LOGIN_IDENTIFIER_MAX_LENGTH)
    identifier: string;

    @Field(() => String)
    @IsString()
    @MinLength(PASSWORD_MIN_LENGTH)
    @MaxLength(PASSWORD_MAX_LENGTH)
    password: string;
}

@ArgsType()
export class ChangeMyPasswordArgs {
    @Field(() => String)
    @IsString()
    @MinLength(PASSWORD_MIN_LENGTH)
    @MaxLength(PASSWORD_MAX_LENGTH)
    currentPassword: string;

    @Field(() => String)
    @IsString()
    @MinLength(PASSWORD_MIN_LENGTH)
    @MaxLength(PASSWORD_MAX_LENGTH)
    newPassword: string;
}

@ArgsType()
export class ChangeMyEmailArgs {
    @Field(() => String)
    @IsString()
    @MinLength(PASSWORD_MIN_LENGTH)
    @MaxLength(PASSWORD_MAX_LENGTH)
    currentPassword: string;

    @Field(() => String)
    @Trim()
    @IsEmail()
    @MaxLength(EMAIL_MAX_LENGTH)
    newEmail: string;
}

@ArgsType()
export class DeleteMyAccountArgs {
    @Field(() => String)
    @IsString()
    @MinLength(PASSWORD_MIN_LENGTH)
    @MaxLength(PASSWORD_MAX_LENGTH)
    currentPassword: string;
}

@ArgsType()
export class IsEmailUsedArgs {
    @Field(() => String)
    @Trim()
    @IsEmail()
    @MaxLength(EMAIL_MAX_LENGTH)
    email: string;
}
