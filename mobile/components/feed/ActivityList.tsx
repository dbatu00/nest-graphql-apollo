import { View, Text } from "react-native";
import { ActivityRow } from "@/components/feed/ActivityRow";
import { useActivities } from "@/hooks/useActivities";
import { ActivityIndicator } from "react-native";

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
            {feed.loading && (
                <View
                    style={{
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 200,
                    }}
                >
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            )}

            {feed.error && <Text>{feed.error}</Text>}

            {!feed.loading && !feed.error && activities.length === 0 && (
                <View style={{ paddingTop: 8 }}>
                    <Text
                        style={{
                            marginTop: 8,
                            fontSize: 13,
                            color: "#9ca3af",
                            textAlign: "center",
                        }}
                    >
                        Nothing to show yet
                    </Text>
                </View>
            )}

            {!feed.loading &&
                activities.map(activity => (
                    <ActivityRow
                        key={activity.id}
                        activity={activity}
                        onToggleFollow={feed.toggleFollow}
                        onDeletePost={feed.deletePost}
                        onTogglePostLike={feed.togglePostLike}
                        onAddComment={feed.publishComment}
                        onDeleteComment={feed.deleteComment}
                        onToggleCommentLike={feed.toggleCommentLike}
                    />
                ))}
        </View>
    );
}