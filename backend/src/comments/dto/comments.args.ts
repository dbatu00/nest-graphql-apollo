import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsString, Min, MinLength } from 'class-validator';
import { NotBlank, Trim } from '../../common/validation/string.decorators';

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
    @NotBlank('content must not be empty')
    content: string;
}

@ArgsType()
export class DeleteCommentArgs {
    @Field(() => Int)
    @IsInt()
    @Min(1)
    commentId: number;
}
