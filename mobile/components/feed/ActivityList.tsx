import { View, Text } from "react-native";
import { ActivityRow } from "@/components/feed/ActivityRow";
import { useActivities } from "@/hooks/useActivities";

type Props = {
    feed: ReturnType<typeof useActivities>;
    filter?: (activity: ReturnType<typeof useActivities>["activities"][number]) => boolean;
};

export function ActivityList({ feed, filter }: Props) {
    const activities = filter
        ? feed.activities.filter(filter)
        : feed.activities;

    return (
        <View>
            {feed.loading && <Text>Loading…</Text>}
            {feed.error && <Text>{feed.error}</Text>}

            {activities.map(activity => (
                <ActivityRow
                    key={activity.id}
                    activity={activity}
                    currentUserId={feed.currentUserId ?? undefined}
                    currentUserAvatarUrl={feed.currentUserAvatarUrl ?? undefined}
                    currentUserLabel={feed.currentUserLabel ?? undefined}
                    onToggleFollow={feed.toggleFollowOptimistic}
                    onToggleLike={feed.toggleLikeOptimistic}
                    onToggleCommentLike={feed.toggleCommentLikeOptimistic}
                    onDeletePost={feed.deletePost}
                    onDeleteComment={feed.deleteCommentFromPost}
                    onAddComment={feed.addCommentToPost}
                />
            ))}
        </View>
    );
}