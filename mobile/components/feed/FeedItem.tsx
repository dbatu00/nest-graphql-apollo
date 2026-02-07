import React from "react";
import { View, Text } from "react-native";
import { Activity } from "@/types/Activity";

type Props = {
  activity: Activity;
};

export function FeedItem({ activity }: Props) {
  switch (activity.type) {
    case "post":
      if (!activity.targetPost) return null;

      return (
        <View>
          <Text>
            <Text style={{ fontWeight: "bold" }}>
              {activity.actor.username}
            </Text>{" "}
            posted
          </Text>

          <Text>{activity.targetPost.content}</Text>
        </View>
      );

    case "follow":
      if (!activity.targetUser) return null;

      return (
        <Text>
          <Text style={{ fontWeight: "bold" }}>
            {activity.actor.username}
          </Text>{" "}
          followed{" "}
          <Text style={{ fontWeight: "bold" }}>
            {activity.targetUser.username}
          </Text>
        </Text>
      );

    default:
      return null;
  }
}
