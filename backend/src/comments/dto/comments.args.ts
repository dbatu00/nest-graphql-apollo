import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { NotBlank, Trim } from '../../common/validation/string.decorators';
import { COMMENT_CONTENT_MAX_LENGTH } from '../../common/validation/input-limits';

@ArgsType()
export class AddCommentArgs {
    @Field(() => Int)
    @IsInt()
    @Min(1)
    postId: number;

    @Field(() => String)
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(COMMENT_CONTENT_MAX_LENGTH)
    @NotBlank('content must not be empty')
    content: string;
}

@ArgsType()
export class CommentByIdArgs {
    @Field(() => Int)
    @IsInt()
    @Min(1)
    id: number;
}

@ArgsType()
export class CommentIdArgs {
    @Field(() => Int)
    @IsInt()
    @Min(1)
    commentId: number;
}
