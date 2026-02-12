import React from "react";
import { View, Text } from "react-native";
import { ProfileLink } from "@/components/common/ProfileLink";
import { Activity } from "@/types/Activity";
import { PostItem } from "@/components/feed/PostItem";

type Props = {
  activity: Activity;
  currentUserId?: number;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
  onToggleLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
  onPressLikes?: (postId: number) => void;
  onDeletePost?: (postId: number) => void;
};

export const ActivityRow = ({
  activity,
  currentUserId,
  onToggleFollow,
  onToggleLike,
  onPressLikes,
  onDeletePost,
}: Props) => {
  const { type, actor, targetUser, targetPost, createdAt } = activity;

  let contentNode: React.ReactNode = null;

  switch (type) {
    case "like":
      contentNode = (
        <>
          <Text style={{ marginBottom: 6 }}>
            <ProfileLink username={actor.username}>
              {actor.displayName ?? actor.username}
            </ProfileLink>
            {" liked "}
            {targetPost?.user && (
              <>
                <ProfileLink username={targetPost.user.username}>
                  {targetPost.user.username}
                </ProfileLink>
                {"'s post"}
              </>
            )}
          </Text>

          {targetPost && onToggleLike && onPressLikes && (
            <View
              style={{
                marginLeft: 12,
                borderLeftWidth: 2,
                borderColor: "#eee",
                paddingLeft: 12,
                marginTop: 8,
              }}
            >
              <PostItem
                post={targetPost}
                currentUserId={currentUserId ?? null}
                onDelete={onDeletePost ?? (() => {})}
                onToggleFollow={onToggleFollow}
                onToggleLike={onToggleLike}
                onPressLikes={onPressLikes}
              />
            </View>
          )}
        </>
      );
      break;

    case "follow":
      contentNode = (
        <Text style={{ marginBottom: 6 }}>
          <ProfileLink username={actor.username}>
            {actor.displayName ?? actor.username}
          </ProfileLink>
          {" followed "}
          {targetUser && (
            <ProfileLink username={targetUser.username}>
              {targetUser.displayName ?? targetUser.username}
            </ProfileLink>
          )}
        </Text>
      );
      break;

    default:
      return null;
  }

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: "#eee",
      }}
    >
      {contentNode}

      <Text style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
        {new Date(createdAt).toLocaleString()}
      </Text>
    </View>
  );
};
