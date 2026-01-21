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

      const data = await graphqlFetch<{ feed: Post[] }>(`
        query {
          feed {
            id
            content
            createdAt
            user {
              id
              username
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

  return {
    posts,
    loading,
    error,
    publish,
    remove,
    refresh: fetchPosts,
  };
}
