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
- Local, ephemeral UI state in this file:
  - ActivityRow → liked-users modal target/visibility + comment draft/submission
  - CommentRow → comment options menu visibility
  - PostCard → comment input focus
  - DateToggleText → relative/absolute date toggle

Delegates:
- Feed mutations → useActivities (via props)
- Activity-specific UI state → local state in ActivityRow
- Banner rendering → ActivityBanner
- Post rendering → PostCard
- Likes modal → LikedUsersModal
- Activity model → Activity type

Used by:
- ActivityList

TODO:
- Consider extracting remaining self-contained UI concepts only if they reduce
  mental load rather than merely moving JSX into new files.
- Remove unjustified defensive chaining on fields the schema guarantees
  non-null/non-empty: actor.username, targetUser.username (once targetUser
  itself is confirmed present), targetPost.user.username (pending
  confirmation of Post's type) — these are enforced at the DB column level
  (unique, non-nullable), not just the TS type level. Keep only the
  genuinely optional checks: targetUser existing at all, targetPost
  existing at all.
- commentInputWrapperFocused sets the same background as the unfocused wrapper.
  Focus state currently has little visible difference and may need a stronger cue.
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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { ProfileLink } from "@/components/common/ProfileLink";
import { UserList } from "@/components/user/UserList";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { useI18n } from "@/hooks/useI18n";
import { Activity } from "@/types/Activity";
import { Comment } from "@/types/Comment";
import {
  getRelativeDateLabel,
  resolveAvatarUri,
} from "@/utils/activityHelpers";
import { COMMENT_CONTENT_MAX_LENGTH } from "@/config/inputLimits";
import {
  activityRowColor as color,
  activityRowStyles as styles,
} from "@/styles";

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
  const { t } = useI18n();
  const { type, actor, targetPost, createdAt } = activity;

  const actorAvatarUri = resolveAvatarUri(actor.displayName, actor.avatarUrl);

  let verb = "";
  let noun = "";
  let targetUser = activity.targetUser;

  if (type === "post") return null;
  else if (targetPost) {
    targetUser = targetPost.user;
    if (type === "comment") {
      verb = t("activity.banner.commentedOn");
      noun = t("activity.banner.postSuffix");
    } else if (type === "share") {
      verb = t("activity.banner.shared");
      noun = t("activity.banner.postSuffix");
    } else if (type === "like") {
      verb = t("activity.banner.liked");
      noun = t("activity.banner.postSuffix");
    }
  }
  else if (type === "follow") {
    verb = t("activity.banner.followed");
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

type DeleteConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

const DeleteConfirmModal = ({
  visible,
  title,
  message,
  confirmLabel,
  loading = false,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) => {
  const { t } = useI18n();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.confirmOverlay}>
        <View
          style={styles.confirmBackdrop}
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => {
            if (!loading) onCancel();
          }}
        >
          <BlurView intensity={18} tint="dark" style={styles.confirmBlur} />
        </View>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              style={[styles.confirmCancelBtn, loading && styles.confirmBtnDisabled]}
            >
              <Text style={styles.confirmCancelText}>{t("activity.confirm.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={[styles.confirmDeleteBtn, loading && styles.confirmBtnDisabled]}
            >
              <Text style={styles.confirmDeleteText}>{loading ? t("activity.confirm.deleting") : confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const CommentRow = ({
  comment,
  postId,
  onDeleteComment,
  onToggleCommentLike,
  onOpenCommentLikes,
}: CommentRowProps) => {
  const { t } = useI18n();
  const [optionsOpen, setOptionsOpen] = React.useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = React.useState(false);
  const [deletingComment, setDeletingComment] = React.useState(false);

  const { user } = useAuth();
  if (!user) return null;

  const avatarUri = resolveAvatarUri(comment.user.displayName, comment.user.avatarUrl);
  const isPendingComment = !!comment.pending;
  const canDelete = (user.id === comment.user.id)
  const likedByMe = comment.likedByMe;
  const likesCount = comment.likesCount;

  const handleConfirmDeleteComment = async () => {
    setDeletingComment(true);
    try {
      await onDeleteComment?.(comment.id, postId);
    } finally {
      setDeletingComment(false);
      setDeleteConfirmVisible(false);
      setOptionsOpen(false);
    }
  };

  return (
    <>
      <View style={styles.commentRow}>
        <ProfileLink username={comment.user.username}>
          <Image source={{ uri: avatarUri }} style={styles.avatarSm} />
        </ProfileLink>

        <View style={styles.flexOne}>
          <Pressable style={[styles.commentBubbleHoverArea, isPendingComment && styles.pendingDim]} disabled={isPendingComment}>
            {({ hovered }) => (
              <View style={styles.commentBubbleRow}>
                <View style={styles.commentBubble}>
                  <ProfileLink username={comment.user.username}>
                    <Text style={styles.commentAuthor}>{comment.user.displayName}</Text>
                  </ProfileLink>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                </View>

                {!isPendingComment && canDelete && (hovered || optionsOpen) && (
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
                          onPress={() => {
                            setOptionsOpen(false);
                            setDeleteConfirmVisible(true);
                          }}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={14} color={color.deleteRed} />
                          <Text style={styles.commentDeleteText}>{t("activity.confirm.delete")}</Text>
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

            {onToggleCommentLike && !isPendingComment && (
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

            {likesCount > 0 && !isPendingComment && (
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

      <DeleteConfirmModal
        visible={deleteConfirmVisible}
        title={t("activity.confirm.deleteCommentTitle")}
        message={t("activity.confirm.deleteCommentMessage")}
        confirmLabel={t("activity.confirm.delete")}
        loading={deletingComment}
        onCancel={() => setDeleteConfirmVisible(false)}
        onConfirm={handleConfirmDeleteComment}
      />
    </>
  );
};

// ─────────────────────────────────────────────
// PostCard
// ─────────────────────────────────────────────

type PostCardProps = {
  post: NonNullable<Activity["targetPost"]>;
  isPending: boolean;
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
  isPending,
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
  const { t } = useI18n();
  const [commentInputFocused, setCommentInputFocused] = React.useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = React.useState(false);

  const { user } = useAuth();
  if (!user) return null;

  const currentUserAvatarUri = resolveAvatarUri(user.displayName, user.avatarUrl);
  const authorAvatarUri = resolveAvatarUri(post.user.displayName, post.user.avatarUrl);
  const isOwner = (user.id === post.user.id);
  const likedByMe = post.likedByMe;
  const likesCount = post.likesCount;
  const hasComments = post.comments.length > 0;

  const headerActions = () => {
    if (!isPending && !isOwner && onToggleFollow) {
      return (
        <TouchableOpacity
          onPress={() => onToggleFollow(post.user.username, !post.user.followedByMe)}
          style={[styles.followBtn, post.user.followedByMe && styles.followBtnActive]}
        >
          <Text style={[styles.followBtnText, post.user.followedByMe && styles.followBtnTextActive]}>
            {post.user.followedByMe ? t("user.following") : t("user.follow")}
          </Text>
        </TouchableOpacity>
      );
    }
    if (!isPending && isOwner && onDeletePost) {
      return (
        <TouchableOpacity onPress={() => setDeleteConfirmVisible(true)} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={[styles.postCard, isPending && styles.pendingDim]} pointerEvents={isPending ? "none" : "auto"}>
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
        {onTogglePostLike && !isPending ? (
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

        {likesCount > 0 && !isPending && (
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
              {post.comments.map((comment) => (
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
                  placeholder={t("activity.comment.placeholder")}
                  placeholderTextColor="#8a8d91"
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={COMMENT_CONTENT_MAX_LENGTH}
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

      <DeleteConfirmModal
        visible={deleteConfirmVisible}
        title={t("activity.confirm.deletePostTitle")}
        message={t("activity.confirm.deletePostMessage")}
        confirmLabel={t("activity.confirm.delete")}
        onCancel={() => setDeleteConfirmVisible(false)}
        onConfirm={() => {
          onDeletePost?.(post.id);
          setDeleteConfirmVisible(false);
        }}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// LikedUsersModal
// ─────────────────────────────────────────────

type LikedUsersModalProps = {
  visible: boolean;
  follow: ReturnType<typeof useFollow>;
  onClose: () => void;
};

const LikedUsersModal = ({
  visible,
  follow,
  onClose,
}: LikedUsersModalProps) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const currentUser = user;
  if (!currentUser) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalBody}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t("activity.modal.likedBy")}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseBtnText}>{t("activity.modal.close")}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScroll}>
          <UserList
            follow={follow}
            currentUserId={currentUser.id}
            isCompact={false}
            onProfileNavigate={onClose}
          />
        </ScrollView>
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
  const targetPostId = targetPost?.id;
  const isPendingPost = !!targetPost?.pending;

  const [likedModalVisible, setLikedModalVisible] = React.useState(false);
  const [likedByTarget, setLikedByTarget] = React.useState<{
    postId?: number;
    commentId?: number;
  } | null>(null);
  const [commentText, setCommentText] = React.useState("");
  const [commentLoading, setCommentLoading] = React.useState(false);

  const handleOpenLikesModal = React.useCallback((postId: number) => {
    setLikedByTarget({ postId });
    setLikedModalVisible(true);
  }, []);

  const handleOpenCommentLikesModal = React.useCallback((commentId: number) => {
    setLikedByTarget({ commentId });
    setLikedModalVisible(true);
  }, []);

  const closeLikedModal = React.useCallback(() => {
    setLikedModalVisible(false);
    setLikedByTarget(null);
  }, []);

  const handleAddComment = React.useCallback(async () => {
    const content = commentText.trim();
    if (!content || targetPostId == null || isPendingPost || !onAddComment || commentLoading) return;

    try {
      setCommentLoading(true);
      await onAddComment(targetPostId, content);
      setCommentText("");
    } catch (err: unknown) {
      console.error("[ActivityRow] failed to add comment", err);
    } finally {
      setCommentLoading(false);
    }
  }, [commentLoading, commentText, isPendingPost, onAddComment, targetPostId]);

  const likedByUsers = useFollow({
    type: "likedBy",
    postId: likedByTarget?.postId,
    commentId: likedByTarget?.commentId,
    enabled: likedModalVisible && likedByTarget != null,
  });

  return (
    <>
      <View style={styles.activityContainer}>
        <ActivityBanner activity={activity} />

        {targetPost && (
          <View style={styles.postContainer}>
            <PostCard
              post={targetPost}
              isPending={isPendingPost}
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
        follow={likedByUsers}
        onClose={closeLikedModal}
      />
    </>
  );
};

