import { StyleSheet } from "react-native";

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
    borderWidth: 2,
    borderColor: "#000",    // HARD LINE
    backgroundColor: "#fff",
  },

  feedContent: {
    padding: 12,
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
    marginTop: 6,
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#000",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 6,
  },

  timestamp: {
    fontSize: 11,
    color: "#000",
  },

  stats: {
    flexDirection: "row",
    gap: 16,
  },

  stat: {
    fontSize: 12,
    color: "#000",
  },

  error: {
    marginTop: 10,
    color: "red",
  },postCard: {
  position: "relative",
  borderWidth: 2,
  borderColor: "#000",
  padding: 12,
  backgroundColor: "#fff",
},

deleteButton: {
  position: "absolute",
  top: 6,
  right: 6,

  paddingHorizontal: 12,
  paddingVertical: 6,

  alignSelf: "flex-start",

  borderWidth: 1,
  borderColor: "#000",
  backgroundColor: "#fff",

  zIndex: 10,
},

deleteText: {
  fontSize: 12,
  fontWeight: "700",
  color: "#000",
},

});
