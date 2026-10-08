import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { NotBlank, Trim } from '../../common/validation/string.decorators';
import { POST_CONTENT_MAX_LENGTH } from '../../common/validation/input-limits';

@ArgsType()
export class PostByIdArgs {
    @Field(() => Int)
    @IsInt()
    @Min(1)
    id: number;
}

@ArgsType()
export class PostIdArgs {
    @Field(() => Int)
    @IsInt()
    @Min(1)
    postId: number;
}

@ArgsType()
export class AddPostArgs {
    @Field(() => String)
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(POST_CONTENT_MAX_LENGTH)
    @NotBlank('content must not be empty')
    content: string;
}
