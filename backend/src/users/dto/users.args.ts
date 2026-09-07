import { ArgsType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, IsUrl, ValidateIf } from 'class-validator';
import { Trim } from '../../common/validation/string.decorators';
import {
    BIO_MAX_LENGTH,
    DISPLAY_NAME_MAX_LENGTH,
    URL_MAX_LENGTH,
} from '../../common/validation/input-limits';

@ArgsType()
export class UpdateMyProfileArgs {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(DISPLAY_NAME_MAX_LENGTH)
    displayName?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(BIO_MAX_LENGTH)
    bio?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @Trim()
    @ValidateIf((_, value) => typeof value === 'string' && value.length > 0)
    @IsUrl({ require_tld: false }, { message: 'avatarUrl must be a valid URL' })
    @MaxLength(URL_MAX_LENGTH)
    avatarUrl?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @Trim()
    @ValidateIf((_, value) => typeof value === 'string' && value.length > 0)
    @IsUrl({ require_tld: false }, { message: 'coverUrl must be a valid URL' })
    @MaxLength(URL_MAX_LENGTH)
    coverUrl?: string;
}
