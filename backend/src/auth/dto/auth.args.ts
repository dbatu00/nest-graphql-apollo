import { ArgsType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

@ArgsType()
export class SignUpArgs {
    @Field(() => String)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @MinLength(1)
    username: string;

    @Field(() => String)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsEmail()
    newEmail: string;
}

@ArgsType()
export class IsEmailUsedArgs {
    @Field(() => String)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsEmail()
    email: string;
}
