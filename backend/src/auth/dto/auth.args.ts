import { ArgsType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@ArgsType()
export class SignUpArgs {
    @Field(() => String)
    @IsString()
    @MinLength(1)
    username: string;

    @Field(() => String)
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
    @IsEmail()
    newEmail: string;
}

@ArgsType()
export class IsEmailUsedArgs {
    @Field(() => String)
    @IsEmail()
    email: string;
}
