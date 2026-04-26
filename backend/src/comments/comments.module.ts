import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { LikesModule } from '../likes/likes.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
    imports: [TypeOrmModule.forFeature([Comment]), LikesModule, ActivityModule],
    providers: [CommentsService, CommentsResolver],
    exports: [CommentsService],
})
export class CommentsModule { }
