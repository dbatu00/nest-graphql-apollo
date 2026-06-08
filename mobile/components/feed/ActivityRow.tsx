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
import { Activity } from "@/types/Activity";
import { Comment } from "@/types/Comment";
import {
  getAbsoluteDateLabel,
  getDisplayLabel,
  getRelativeDateLabel,
  isSameId,
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
  currentUserId?: number;
  currentUserAvatarUrl?: string;
  currentUserLabel?: string;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
  onDeletePost?: (postId: number) => void;
  onDeleteComment?: (commentId: number, postId: number) => Promise<void>;
  onToggleLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
  onToggleCommentLike?: (commentId: number, postId: number, currentlyLiked: boolean) => Promise<void>;
  onAddComment?: (postId: number, content: string) => Promise<void>;
};

type ActivityBannerContext = {
  actorLabel: string;
  actorUsername?: string;
  targetLabel: string;
  targetUsername?: string;
  targetVerb: string;
  targetNoun: string;
};

type BannerActivityType = Exclude<Activity["type"], "post">;

const actionContentByType: Record<BannerActivityType, (ctx: ActivityBannerContext) => React.ReactNode> = {
  comment: (ctx) => (
    <>
      <ClickableName username={ctx.actorUsername} label={ctx.actorLabel} />
      <Text> commented on </Text>
      <ClickableName username={ctx.targetUsername} label={ctx.targetLabel} />
      <Text>{ctx.targetNoun}</Text>
    </>
  ),
  like: (ctx) => (
    <>
      <ClickableName username={ctx.actorUsername} label={ctx.actorLabel} />
      <Text> liked </Text>
      <ClickableName username={ctx.targetUsername} label={ctx.targetLabel} />
      <Text>{ctx.targetNoun}</Text>
    </>
  ),
  follow: (ctx) => (
    <>
      <ClickableName username={ctx.actorUsername} label={ctx.actorLabel} />
      <Text> followed </Text>
      <ClickableName username={ctx.targetUsername} label={ctx.targetLabel} />
    </>
  ),
  share: (ctx) => (
    <>
      <ClickableName username={ctx.actorUsername} label={ctx.actorLabel} />
      <Text> shared </Text>
      <ClickableName username={ctx.targetUsername} label={ctx.targetLabel} />
      <Text>{ctx.targetNoun}</Text>
    </>
  ),
};

const ClickableName = ({ username, label }: { username?: string; label: string }) => {
  if (username) {
    return (
      <ProfileLink username={username}>
        <Text style={styles.bannerName}>{label}</Text>
      </ProfileLink>
    );
  }

  return <Text style={styles.bannerName}>{label}</Text>;
};

// ─────────────────────────────────────────────
// DateToggleText
// ─────────────────────────────────────────────

const DateToggleText = ({ date }: { date: string }) => {
  const [showAbsolute, setShowAbsolute] = React.useState(false);
  const label = showAbsolute ? getAbsoluteDateLabel(date) : getRelativeDateLabel(date);
  if (!label) return null;
  return (
    <TouchableOpacity onPress={() => setShowAbsolute(p => !p)} style={styles.dateToggleTouch}>
      <Text style={styles.dateText}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// ActivityBanner
// ─────────────────────────────────────────────

type ActivityBannerProps = {
  activity: Activity;
};

const ActivityBanner = ({ activity }: ActivityBannerProps) => {
  const { type, actor, targetUser, targetPost, createdAt } = activity;
  if (type === "post") return null;

  const actorLabel = getDisplayLabel(actor);
  const actorUsername = actor.username?.trim();
  const targetUserLabel = getDisplayLabel(targetUser);
  const postOwnerLabel = getDisplayLabel(targetPost?.user);
  const postOwnerUsername = targetPost?.user?.username?.trim();

  const targetVerb =
    type === "follow"
      ? "followed"
      : type === "comment"
        ? "commented on"
        : type === "share"
          ? "shared"
          : "liked";

  const targetNoun = type === "follow" ? "" : "'s post";

  const targetLabel = type === "follow" ? targetUserLabel : postOwnerLabel;
  const targetUsername = type === "follow" ? targetUser?.username?.trim() : postOwnerUsername;

  const context: ActivityBannerContext = {
    actorLabel,
    actorUsername,
    targetLabel,
    targetUsername,
    targetVerb,
    targetNoun,
  };

  const actorAvatarUri = resolveAvatarUri(actor.avatarUrl, actorLabel, 128);
  const targetAvatarUrl = type === "follow" ? targetUser?.avatarUrl : targetPost?.user?.avatarUrl;
  const targetAvatarUri = resolveAvatarUri(targetAvatarUrl, targetLabel, 64);

  return (
    <View style={styles.activityBanner}>
      {actorUsername ? (
        <ProfileLink username={actorUsername}>
          <Image source={{ uri: actorAvatarUri }} style={styles.avatarMd} />
        </ProfileLink>
      ) : (
        <Image source={{ uri: actorAvatarUri }} style={styles.avatarMd} />
      )}
      <View style={styles.bannerContent}>
        <Text style={styles.bannerText}>{actionContentByType[type](context)}</Text>
        <DateToggleText date={createdAt} />
      </View>
      {targetUsername && (
        <ProfileLink username={targetUsername}>
          <Image source={{ uri: targetAvatarUri }} style={styles.followBannerAvatar} />
        </ProfileLink>
      )}
      {!targetUsername && (
        <Image source={{ uri: targetAvatarUri }} style={styles.followBannerAvatar} />
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// CommentRow
// ─────────────────────────────────────────────

type CommentRowProps = {
  comment: Comment;
  postId: number;
  currentUserId?: number;
  onDeleteComment?: (commentId: number, postId: number) => Promise<void>;
  onToggleCommentLike?: (commentId: number, postId: number, currentlyLiked: boolean) => Promise<void>;
  onOpenCommentLikes: (commentId: number) => void;
};

const CommentRow = ({
  comment,
  postId,
  currentUserId,
  onDeleteComment,
  onToggleCommentLike,
  onOpenCommentLikes,
}: CommentRowProps) => {
  const [optionsOpen, setOptionsOpen] = React.useState(false);

  const author = getDisplayLabel(comment.user);
  const avatarUri = resolveAvatarUri(comment.user.avatarUrl, author, 64);
  const canDelete = !!onDeleteComment && currentUserId != null && isSameId(currentUserId, comment.user.id);
  const likedByMe = comment.likedByMe ?? false;
  const likesCount = comment.likesCount ?? 0;

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
                  <Text style={styles.commentAuthor}>{author}</Text>
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
                          await onDeleteComment!(comment.id, postId);
                          setOptionsOpen(false);
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
  currentUserId?: number;
  currentUserAvatarUrl?: string;
  currentUserLabel?: string;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
  onDeletePost?: (postId: number) => void;
  onDeleteComment?: (commentId: number, postId: number) => Promise<void>;
  onToggleLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
  onToggleCommentLike?: (commentId: number, postId: number, currentlyLiked: boolean) => Promise<void>;
  showCommentInput: boolean;
  // from hook
  onOpenLikes: (postId: number) => void;
  onOpenCommentLikes: (commentId: number) => void;
  commentText: string;
  setCommentText: (t: string) => void;
  commentLoading: boolean;
  onSubmitComment: () => void;
};

const PostCard = ({
  post,
  currentUserId,
  currentUserAvatarUrl,
  currentUserLabel,
  onToggleFollow,
  onDeletePost,
  onDeleteComment,
  onToggleLike,
  onToggleCommentLike,
  showCommentInput,
  onOpenLikes,
  onOpenCommentLikes,
  commentText,
  setCommentText,
  commentLoading,
  onSubmitComment,
}: PostCardProps) => {
  const [commentInputFocused, setCommentInputFocused] = React.useState(false);
  const authorLabel = getDisplayLabel(post.user);
  const authorAvatarUri = resolveAvatarUri(post.user.avatarUrl, authorLabel, 128);
  const currentUserAvatarUri = resolveAvatarUri(currentUserAvatarUrl, currentUserLabel?.trim() || "You", 64);
  const isOwner = isSameId(currentUserId, post.user.id);
  const likedByMe = post.likedByMe ?? false;
  const likesCount = post.likesCount ?? 0;
  const hasComments = (post.comments?.length ?? 0) > 0;

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
            <Text style={styles.postAuthorName}>{authorLabel}</Text>
          </ProfileLink>
          <DateToggleText date={post.createdAt} />
        </View>
        {headerActions()}
      </View>

      <Text style={styles.postContent}>{post.content}</Text>

      <View style={styles.engagementRow}>
        {onToggleLike ? (
          <TouchableOpacity style={styles.likeBtn} onPress={() => onToggleLike(post.id, likedByMe)}>
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
            onPress={() => onOpenLikes(post.id)}
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
                  currentUserId={currentUserId}
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
  currentUserId?: number;
  onClose: () => void;
  onToggleFollow: (username: string, shouldFollow: boolean) => void | Promise<void>;
};

const LikedUsersModal = ({
  visible,
  likedUsers,
  loading,
  currentUserId,
  onClose,
  onToggleFollow,
}: LikedUsersModalProps) => (
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
                currentUserId={currentUserId}
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
);

// ─────────────────────────────────────────────
// ActivityRow (root export)
// ─────────────────────────────────────────────

export const ActivityRow = ({
  activity,
  currentUserId,
  currentUserAvatarUrl,
  currentUserLabel,
  onToggleFollow,
  onDeletePost,
  onDeleteComment,
  onToggleLike,
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
              currentUserId={currentUserId}
              currentUserAvatarUrl={currentUserAvatarUrl}
              currentUserLabel={currentUserLabel}
              onToggleFollow={onToggleFollow}
              onDeletePost={onDeletePost}
              onDeleteComment={onDeleteComment}
              onToggleLike={onToggleLike}
              onToggleCommentLike={onToggleCommentLike}
              showCommentInput={!!onAddComment}
              onOpenLikes={handleOpenLikesModal}
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
        currentUserId={currentUserId}
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