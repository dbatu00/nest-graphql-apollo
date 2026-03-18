import { ArgsType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, MinLength, MaxLength, IsUrl } from 'class-validator';

@ArgsType()
export class UsernameArgs {
    @Field(() => String)
    @IsString()
    @MinLength(1)
    username: string;
}

@ArgsType()
export class UpdateMyProfileArgs {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    displayName?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(160)
    bio?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsUrl({ require_tld: false }, { message: 'avatarUrl must be a valid URL' })
    @MaxLength(500)
    avatarUrl?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsUrl({ require_tld: false }, { message: 'coverUrl must be a valid URL' })
    @MaxLength(500)
    coverUrl?: string;
}
