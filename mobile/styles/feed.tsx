import { StyleSheet, Platform } from "react-native";

export const feedStyles = StyleSheet.create({
  feedOuter: {
    flex: 1,
    alignItems: "center",
    paddingTop: 12,
  },

  feedContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 520,          // Twitter-like column
    backgroundColor: "#f9f9f9",
  },

  feedContent: {
    padding: 12,
    gap: 12,
  },

   likeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  likeButtonLiked: {
    backgroundColor: "#fecaca",
  },

  likeIcon: {
    fontSize: 16,
    color: "#000",
  },

  likeIconLiked: {
    color: "#ef4444",
  },

  separator: {
    height: 12,
  },

  author: {
    fontWeight: "700",
    fontSize: 15,
    color: "#000",
  },

  content: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: 14,
    lineHeight: 20,
    color: "#1f2937",
    paddingLeft: 0,
    paddingTop: 0,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0,
    borderTopColor: "transparent",
    paddingTop: 2,
    marginTop: 2,
  },

  timestamp: {
    fontSize: 11,
    color: "#d1d5db",
  },

  stats: {
    flexDirection: "row",
    gap: 16,
  },

  stat: {
    fontSize: 12,
    color: "#6b7280",
  },

  error: {
    marginTop: 10,
    color: "#ef4444",
  },

  postCard: {
    position: "relative",
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 12,
    padding: 8,
    backgroundColor: "#fff",
    marginVertical: 0,
    marginHorizontal: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },

  deleteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 8,
    backgroundColor: "#000",
    zIndex: 10,
  },

  deleteText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },

  activityCard: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0,
    borderColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },

});
