/*
Kind:
Component

Role:
Activity renderer

Responsibility:
- Transform a single Activity into its complete interactive UI
- Compose the appropriate presentation components
- Connect user interactions to feed mutations
- Own only local, ephemeral UI state

Owns:
- Activity-specific presentation
- Composition of ActivityBanner, PostCard and LikedUsersModal
- Local, ephemeral UI state scoped to subcomponents defined in this file:
  - CommentRow → comment options menu visibility
  - PostCard → comment input focus
  - DateToggleText → relative/absolute date toggle

Delegates:
- Feed mutations → useActivities (via props)
- Activity-specific UI state → useActivityRow
- Banner rendering → ActivityBanner
- Post rendering → PostCard
- Likes modal → LikedUsersModal
- Activity model → Activity type

Used by:
- ActivityList

TODO:
- Consider extracting remaining self-contained UI concepts only if they reduce
  mental load rather than merely moving JSX into new files *
  currently favoring this because i would like to open activityrow.tsx and see logic only
- - Remove unjustified defensive chaining on fields the schema guarantees
  non-null/non-empty: actor.username, targetUser.username (once targetUser
  itself is confirmed present), targetPost.user.username (pending
  confirmation of Post's type) — these are enforced at the DB column level
  (unique, non-nullable), not just the TS type level. Keep only the
  genuinely optional checks: targetUser existing at all, targetPost
  existing at all.

-commentInputWrapperFocused sets backgroundColor: color.bgComment, which is identical to the unfocused wrapper's background. Right now focusing the comment input has no visible effect. Probably meant to add a border color or shadow.
*/

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  Image,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ProfileLink } from "@/components/common/ProfileLink";
import { UserRow } from "@/components/user/UserRow";
import { useAuth } from "@/hooks/useAuth";
import { Activity } from "@/types/Activity";
import { Comment } from "@/types/Comment";
import {
  getRelativeDateLabel,
  resolveAvatarUri,
} from "@/utils/activityHelpers";
import { LikedUser, useActivityRow } from "./useActivityRow";

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────

const color = {
  blue: "#1877f2",
  blueBg: "#e7f0fd",
  textPrimary: "#050505",
  textSecondary: "#65676b",
  divider: "#ced0d4",
  bgComment: "#f0f2f5",
  bgWhite: "#fff",
  deleteRed: "#e41e3f",
} as const;

const size = {
  avatarMd: 40,
  avatarSm: 32,
  radiusMd: 20,
  radiusSm: 16,
} as const;

const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
} as const;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Props = {
  activity: Activity;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
  onDeletePost?: (postId: number) => void;
  onDeleteComment?: (commentId: number, postId: number) => Promise<void>;
  onTogglePostLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
  onToggleCommentLike?: (commentId: number, postId: number, currentlyLiked: boolean) => Promise<void>;
  onAddComment?: (postId: number, content: string) => Promise<void>;
};


// ─────────────────────────────────────────────
// ActivityBanner
// ─────────────────────────────────────────────

const ClickableName = (username: string, label: string) => {
  return (
    <ProfileLink username={username}>
      <Text style={styles.bannerName}>{label}</Text>
    </ProfileLink>
  );
};

// ─────────────────────────────────────────────
// ActivityBanner
// ─────────────────────────────────────────────

const ActivityBanner = ({ activity }: { activity: Activity }) => {
  const { type, actor, targetPost, createdAt } = activity;

  const actorAvatarUri = resolveAvatarUri(activity.actor.displayName, activity.actor.avatarUrl);

  let verb = "";
  let noun = "";
  let targetUser = activity.targetUser;

  if (type === "post") return null;
  else if (targetPost) {
    targetUser = targetPost.user!;
    if (type === "comment") {
      verb = "commented on";
      noun = "'s post";
    } else if (type === "share") {
      verb = "shared";
      noun = "'s post";
    } else if (type === "like") {
      verb = "liked";
      noun = "'s post";
    }
  }
  else if (type === "follow") {
    verb = "followed";
    noun = "";
  }
  else {
    console.error(`ActivityBanner: unhandled activity type "${type}"`);
    return null;
  }

  const targetAvatarUri = resolveAvatarUri(targetUser.displayName, targetUser.avatarUrl);

  return (
    <View style={styles.activityBanner}>
      <ProfileLink username={actor.username}>
        <Image source={{ uri: actorAvatarUri }} style={styles.avatarMd} />
      </ProfileLink>

      <View style={styles.bannerContent}>
        <Text style={styles.bannerText}>
          {ClickableName(actor.username, actor.displayName)}
          <Text> {verb} </Text>
          {ClickableName(targetUser.username, targetUser.displayName)}
          <Text>{noun}</Text>
        </Text>
        <DateToggleText date={createdAt} />
      </View>

      <ProfileLink username={targetUser.username}>
        <Image source={{ uri: targetAvatarUri }} style={styles.followBannerAvatar} />
      </ProfileLink>
    </View>
  );
};

// ─────────────────────────────────────────────
// CommentRow
// ─────────────────────────────────────────────

type CommentRowProps = {
  comment: Comment;
  postId: number;
  onDeleteComment?: (commentId: number, postId: number) => Promise<void>;
  onToggleCommentLike?: (commentId: number, postId: number, currentlyLiked: boolean) => Promise<void>;
  onOpenCommentLikes: (commentId: number) => void;
};

const CommentRow = ({
  comment,
  postId,
  onDeleteComment,
  onToggleCommentLike,
  onOpenCommentLikes,
}: CommentRowProps) => {
  const [optionsOpen, setOptionsOpen] = React.useState(false);

  const { user } = useAuth();
  if (!user) return null;

  const avatarUri = resolveAvatarUri(comment.user.displayName, comment.user.avatarUrl);
  const canDelete = (user.id === comment.user.id)
  const likedByMe = comment.likedByMe;
  const likesCount = comment.likesCount;

  return (
    <View style={styles.commentRow}>
      <ProfileLink username={comment.user.username}>
        <Image source={{ uri: avatarUri }} style={styles.avatarSm} />
      </ProfileLink>

      <View style={styles.flexOne}>
        <Pressable style={styles.commentBubbleHoverArea}>
          {({ hovered }) => (
            <View style={styles.commentBubbleRow}>
              <View style={styles.commentBubble}>
                <ProfileLink username={comment.user.username}>
                  <Text style={styles.commentAuthor}>{comment.user.displayName}</Text>
                </ProfileLink>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>

              {canDelete && (hovered || optionsOpen) && (
                <View style={styles.commentOptionsWrap}>
                  <TouchableOpacity
                    style={styles.commentOptionsBtn}
                    onPress={() => setOptionsOpen(o => !o)}
                  >
                    <Ionicons name="ellipsis-horizontal" size={14} color={color.textSecondary} />
                  </TouchableOpacity>

                  {optionsOpen && (
                    <View style={styles.commentOptionsMenu}>
                      <TouchableOpacity
                        style={styles.commentOptionsMenuItem}
                        onPress={async () => {
                          try {
                            await onDeleteComment?.(comment.id, postId);
                          } finally {
                            setOptionsOpen(false);
                          }
                        }}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={14} color={color.deleteRed} />
                        <Text style={styles.commentDeleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </Pressable>

        <View style={styles.commentActions}>
          <View style={styles.commentDateWrapper}>
            <DateToggleText date={comment.createdAt} />
          </View>

          {onToggleCommentLike && (
            <TouchableOpacity
              style={styles.commentLikeBtn}
              onPress={() => onToggleCommentLike(comment.id, postId, likedByMe)}
            >
              <MaterialCommunityIcons
                name={likedByMe ? "thumb-up" : "thumb-up-outline"}
                size={12}
                color={likedByMe ? color.blue : color.textSecondary}
              />
            </TouchableOpacity>
          )}

          {likesCount > 0 && (
            <Pressable
              onPress={() => onOpenCommentLikes(comment.id)}
              style={({ hovered }) => [
                styles.commentLikeCountBtn,
                hovered && styles.commentLikeCountBtnHover,
              ]}
            >
              <Text style={styles.commentLikeCountText}>{likesCount}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// PostCard
// ─────────────────────────────────────────────

type PostCardProps = {
  post: NonNullable<Activity["targetPost"]>;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
  onDeletePost?: (postId: number) => void;
  onDeleteComment?: (commentId: number, postId: number) => Promise<void>;
  onTogglePostLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
  onToggleCommentLike?: (commentId: number, postId: number, currentlyLiked: boolean) => Promise<void>;
  showCommentInput: boolean;
  // from hook
  onOpenPostLikes: (postId: number) => void;
  onOpenCommentLikes: (commentId: number) => void;
  commentText: string;
  setCommentText: (t: string) => void;
  commentLoading: boolean;
  onSubmitComment: () => void;
};

const PostCard = ({
  post,
  onToggleFollow,
  onDeletePost,
  onDeleteComment,
  onTogglePostLike,
  onToggleCommentLike,
  showCommentInput,
  onOpenPostLikes,
  onOpenCommentLikes,
  commentText,
  setCommentText,
  commentLoading,
  onSubmitComment,
}: PostCardProps) => {
  const [commentInputFocused, setCommentInputFocused] = React.useState(false);

  const { user } = useAuth();
  if (!user || !post?.user) return null;

  const currentUserAvatarUri = resolveAvatarUri(user!.displayName, user!.avatarUrl);
  const authorAvatarUri = resolveAvatarUri(post.user.displayName, post.user.avatarUrl);
  const isOwner = (user!.id === post.user.id);
  const likedByMe = post.likedByMe;
  const likesCount = post.likesCount;
  const hasComments = post.comments!.length > 0;

  const headerActions = () => {
    if (!isOwner && onToggleFollow) {
      return (
        <TouchableOpacity
          onPress={() => onToggleFollow(post.user.username, !post.user.followedByMe)}
          style={[styles.followBtn, post.user.followedByMe && styles.followBtnActive]}
        >
          <Text style={[styles.followBtnText, post.user.followedByMe && styles.followBtnTextActive]}>
            {post.user.followedByMe ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      );
    }
    if (isOwner && onDeletePost) {
      return (
        <TouchableOpacity onPress={() => onDeletePost(post.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <ProfileLink username={post.user.username}>
          <Image source={{ uri: authorAvatarUri }} style={styles.avatarMd} />
        </ProfileLink>
        <View style={styles.postHeaderContent}>
          <ProfileLink username={post.user.username}>
            <Text style={styles.postAuthorName}>{post.user.displayName}</Text>
          </ProfileLink>
          <DateToggleText date={post.createdAt} />
        </View>
        {headerActions()}
      </View>

      <Text style={styles.postContent}>{post.content}</Text>

      <View style={styles.engagementRow}>
        {onTogglePostLike ? (
          <TouchableOpacity style={styles.likeBtn} onPress={() => onTogglePostLike(post.id, likedByMe)}>
            <MaterialCommunityIcons
              name={likedByMe ? "thumb-up" : "thumb-up-outline"}
              size={18}
              color={likedByMe ? color.blue : color.textSecondary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.likeBtnPlaceholder} />
        )}

        {likesCount > 0 && (
          <Pressable
            onPress={() => onOpenPostLikes(post.id)}
            style={({ hovered }) => [
              styles.likeCountBtn,
              hovered && styles.likeCountBtnHover,
            ]}
          >
            <Text style={styles.likeCountText}>{likesCount}</Text>
          </Pressable>
        )}
      </View>

      {(hasComments || showCommentInput) && (
        <View style={styles.commentsSection}>
          {hasComments && (
            <View style={styles.commentList}>
              {post.comments?.map((comment) => (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  onDeleteComment={onDeleteComment}
                  onToggleCommentLike={onToggleCommentLike}
                  onOpenCommentLikes={onOpenCommentLikes}
                />
              ))}
            </View>
          )}

          {showCommentInput && (
            <View style={styles.commentInputRow}>
              <Image source={{ uri: currentUserAvatarUri }} style={styles.avatarSm} />
              <View
                style={[
                  styles.commentInputWrapper,
                  commentInputFocused && styles.commentInputWrapperFocused,
                ]}
              >
                <TextInput
                  placeholder="Write a comment..."
                  placeholderTextColor="#8a8d91"
                  value={commentText}
                  onChangeText={setCommentText}
                  editable={!commentLoading}
                  onFocus={() => setCommentInputFocused(true)}
                  onBlur={() => setCommentInputFocused(false)}
                  onSubmitEditing={onSubmitComment}
                  returnKeyType="send"
                  underlineColorAndroid="transparent"
                  style={[
                    styles.commentInput,
                    Platform.OS === "web"
                      ? ({ outlineStyle: "none", outlineWidth: 0 } as never)
                      : null,
                  ]}
                />
                {commentText.trim().length > 0 && (
                  <TouchableOpacity onPress={onSubmitComment} disabled={commentLoading} style={styles.commentSendBtn}>
                    <Text style={styles.commentSendBtnText}>{commentLoading ? "…" : "➤"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// LikedUsersModal
// ─────────────────────────────────────────────

type LikedUsersModalProps = {
  visible: boolean;
  likedUsers: LikedUser[];
  loading: boolean;
  onClose: () => void;
  onToggleFollow: (username: string, shouldFollow: boolean) => void | Promise<void>;
};

const LikedUsersModal = ({
  visible,
  likedUsers,
  loading,
  onClose,
  onToggleFollow,
}: LikedUsersModalProps) => {
  const { user } = useAuth();
  const currentUser = user;
  if (!currentUser) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalBody}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Liked by</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
        {!loading && (
          <ScrollView style={styles.modalScroll}>
            {likedUsers.map((user) => (
              <View key={user.id} style={styles.modalUserRow}>
                <UserRow
                  user={user}
                  currentUserId={currentUser.id}
                  onToggleFollow={onToggleFollow}
                  isCompact={false}
                  onProfileNavigate={onClose}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  )
};

// ─────────────────────────────────────────────
// DateToggleText
// ─────────────────────────────────────────────

const DateToggleText = ({ date }: { date: string }) => {
  const [showAbsolute, setShowAbsolute] = React.useState(false);
  const label = showAbsolute ? date : getRelativeDateLabel(date);
  return (
    <TouchableOpacity onPress={() => setShowAbsolute(p => !p)} style={styles.dateToggleTouch}>
      <Text style={styles.dateText}>{label}</Text>
    </TouchableOpacity>
  );
};


// ─────────────────────────────────────────────
// ActivityRow (root export)
// ─────────────────────────────────────────────

export const ActivityRow = ({
  activity,
  onToggleFollow,
  onDeletePost,
  onDeleteComment,
  onTogglePostLike,
  onToggleCommentLike,
  onAddComment,
}: Props) => {
  const { targetPost } = activity;

  const {
    likedUsers,
    likedModalVisible,
    likedLoading,
    closeLikedModal,
    handleOpenLikesModal,
    handleOpenCommentLikesModal,
    handleToggleFollowInModal,
    commentText,
    setCommentText,
    commentLoading,
    handleAddComment,
  } = useActivityRow({ onToggleFollow, onAddComment, targetPostId: targetPost?.id });

  return (
    <>
      <View style={styles.activityContainer}>
        <ActivityBanner activity={activity} />

        {targetPost && (
          <View style={styles.postContainer}>
            <PostCard
              post={targetPost}
              onToggleFollow={onToggleFollow}
              onDeletePost={onDeletePost}
              onDeleteComment={onDeleteComment}
              onTogglePostLike={onTogglePostLike}
              onToggleCommentLike={onToggleCommentLike}
              showCommentInput={!!onAddComment}
              onOpenPostLikes={handleOpenLikesModal}
              onOpenCommentLikes={handleOpenCommentLikesModal}
              commentText={commentText}
              setCommentText={setCommentText}
              commentLoading={commentLoading}
              onSubmitComment={handleAddComment}
            />
          </View>
        )}
      </View>

      <LikedUsersModal
        visible={likedModalVisible}
        likedUsers={likedUsers}
        loading={likedLoading}
        onClose={closeLikedModal}
        onToggleFollow={handleToggleFollowInModal}
      />
    </>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  // Layout
  activityContainer: {
    backgroundColor: color.bgWhite,
    marginVertical: space.sm - 2,
    borderRadius: space.md,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  postContainer: {
    marginLeft: space.sm,
    marginVertical: space.sm,
  },

  // Avatars
  avatarMd: {
    width: size.avatarMd,
    height: size.avatarMd,
    borderRadius: size.radiusMd,
  },
  avatarSm: {
    width: size.avatarSm,
    height: size.avatarSm,
    borderRadius: size.radiusSm,
  },

  // Activity banner
  activityBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.bgComment,
  },
  bannerContent: {
    marginLeft: 10,
    alignSelf: "flex-start",
  },
  followBannerAvatar: {
    width: size.avatarMd,
    height: size.avatarMd,
    borderRadius: size.radiusMd,
    marginLeft: space.sm,
  },
  bannerText: {
    fontSize: 15,
    color: color.textPrimary,
    lineHeight: 20,
  },
  bannerName: {
    fontWeight: "600" as const,
    color: color.textPrimary,
  },

  // Post card
  postCard: {
    backgroundColor: color.bgWhite,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  postHeaderContent: {
    flex: 1,
    marginLeft: 10,
    alignSelf: "flex-start",
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: color.textPrimary,
  },
  postContent: {
    fontSize: 15,
    color: color.textPrimary,
    lineHeight: 22,
    minHeight: 66,
    paddingHorizontal: space.md,
    paddingBottom: space.xs + 2,
  },

  // Engagement row
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: space.xs,
  },
  likeBtn: {
    paddingVertical: space.xs,
    paddingLeft: space.md,
    borderRadius: space.xs,
  },
  likeBtnPlaceholder: {
    width: 60,
  },
  likeCountBtn: {
    marginLeft: space.sm,
    borderWidth: 1,
    borderColor: color.divider,
    borderRadius: 10,
    paddingHorizontal: space.xs + 2,
    paddingVertical: 2,
  },
  likeCountBtnHover: {
    backgroundColor: color.bgComment,
  },
  likeCountText: {
    fontSize: 13,
    color: color.textSecondary,
  },

  // Follow / delete actions
  followBtn: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 1,
    borderRadius: space.xs - 2,
    backgroundColor: color.blueBg,
  },
  followBtnActive: {
    backgroundColor: "#e4e6eb",
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: color.blue,
  },
  followBtnTextActive: {
    color: color.textPrimary,
  },
  deleteBtn: {
    padding: space.sm,
  },
  deleteBtnText: {
    fontSize: 14,
    color: color.textSecondary,
  },

  // Comments section
  commentsSection: {
    backgroundColor: color.bgWhite,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.md,
    gap: space.sm,
  },
  commentList: {
    gap: space.sm,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.sm,
  },
  flexOne: {
    flex: 1,
  },
  commentBubbleHoverArea: {
    width: "100%",
  },
  commentBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
  },
  commentBubble: {
    backgroundColor: color.bgComment,
    borderRadius: space.xl,
    paddingHorizontal: 10,
    paddingVertical: space.xs + 2,
    alignSelf: "flex-start",
    flexShrink: 1,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: color.textPrimary,
  },
  commentContent: {
    fontSize: 14,
    color: color.textPrimary,
    lineHeight: 19,
  },

  // Comment options (delete menu)
  commentOptionsWrap: {
    marginLeft: space.sm,
    position: "relative",
  },
  commentOptionsBtn: {
    marginLeft: space.sm,
    paddingHorizontal: space.xs + 2,
    paddingVertical: 1,
    borderRadius: space.sm,
    backgroundColor: color.bgComment,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 24,
    minHeight: 20,
  },
  commentOptionsMenu: {
    position: "absolute",
    top: 24,
    right: 0,
    backgroundColor: color.bgWhite,
    borderRadius: space.sm,
    borderWidth: 1,
    borderColor: color.divider,
    paddingVertical: space.xs,
    minWidth: 110,
    zIndex: 10,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  commentOptionsMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: space.xs + 2,
    gap: space.xs + 2,
  },
  commentDeleteText: {
    fontSize: 13,
    color: color.deleteRed,
    fontWeight: "600" as const,
  },

  // Comment actions (date + like)
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: space.xs,
  },
  commentDateWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.sm,
    marginTop: -2,
  },
  commentLikeBtn: {
    paddingTop: 3,
    paddingBottom: 2,
    paddingRight: space.xs,
    borderRadius: 2,
  },
  commentLikeCountBtn: {
    marginLeft: 3,
    borderWidth: 1,
    borderColor: color.divider,
    borderRadius: space.sm,
    paddingHorizontal: space.xs,
    paddingVertical: 1,
    minHeight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  commentLikeCountBtnHover: {
    backgroundColor: color.bgComment,
  },
  commentLikeCountText: {
    fontSize: 11,
    lineHeight: 11,
    textAlign: "center",
    color: color.textSecondary,
  },

  // Comment input
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.xs,
  },
  commentInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: size.avatarSm,
    backgroundColor: color.bgComment,
    borderRadius: size.radiusMd,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: space.md,
  },
  commentInputWrapperFocused: {
    backgroundColor: color.bgComment,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: space.xl,
    color: color.textPrimary,
    textAlignVertical: "center",
  },
  commentSendBtn: {
    marginLeft: space.xs + 2,
  },
  commentSendBtnText: {
    fontSize: 16,
    color: color.blue,
  },

  // Date
  dateToggleTouch: {
    alignSelf: "flex-start",
  },
  dateText: {
    fontSize: 12,
    color: color.textSecondary,
    marginTop: 1,
  },

  // Modal
  modalBody: {
    flex: 1,
    backgroundColor: color.bgComment,
  },
  modalHeader: {
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    backgroundColor: color.bgWhite,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: color.divider,
  },
  modalTitle: {
    fontSize: space.xl,
    fontWeight: "700" as const,
    color: color.textPrimary,
  },
  modalCloseBtn: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: space.xs - 2,
    backgroundColor: color.bgComment,
  },
  modalCloseBtnText: {
    fontWeight: "600" as const,
    color: color.textPrimary,
    fontSize: 13,
  },
  modalScroll: {
    flex: 1,
    paddingTop: space.sm,
  },
  modalUserRow: {
    backgroundColor: color.bgWhite,
    marginHorizontal: space.md,
    marginVertical: space.xs,
    borderRadius: 10,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
});