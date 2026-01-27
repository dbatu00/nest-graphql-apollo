import { useEffect, useState, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { Post } from "@/types/Post";

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);

      const data = await graphqlFetch<{ feed: Post[] }>
      (`
       query {
          feed {
            id
            content
            createdAt
            user {
              id
              username
              isFollowedByMe
            }
          }
        }
      `);

      setPosts(data.feed);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const publish = async (content: string) => {
    await graphqlFetch(
      `
      mutation AddPost($content: String!) {
        addPost(content: $content) {
          id
        }
      }
      `,
      { content }
    );

    fetchPosts();
  };

  const remove = async (postId: number) => {
    await graphqlFetch(
      `
      mutation DeletePost($postId: Int!) {
        deletePost(postId: $postId)
      }
      `,
      { postId }
    );

    fetchPosts();
  };

  const toggleFollowOptimistic = async (
  username: string,
  shouldFollow: boolean,
) => {
  // 1. Optimistic update
  setPosts(prev =>
    prev.map(post =>
      post.user.username === username
        ? {
            ...post,
            user: {
              ...post.user,
              isFollowedByMe: shouldFollow,
            },
          }
        : post
    )
  );

  // 2. Fire mutation (do NOT await for UI)
  try {
    await graphqlFetch(
      `
      mutation ToggleFollow($username: String!) {
        ${shouldFollow ? "followUser" : "unfollowUser"}(username: $username)
      }
      `,
      { username }
    );
  } catch {
    // 3. Rollback if failed
    setPosts(prev =>
      prev.map(post =>
        post.user.username === username
          ? {
              ...post,
              user: {
                ...post.user,
                isFollowedByMe: !shouldFollow,
              },
            }
          : post
      )
    );
  }
};


  return {
    posts,
    loading,
    error,
    publish,
    remove,
    refresh: fetchPosts,
    toggleFollowOptimistic
  };
}
