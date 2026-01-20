import { useEffect, useState, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { Post } from "@/types/Post";

type FeedState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; posts: Post[] };

export function useFeed() {
  const [state, setState] = useState<FeedState>({ status: "idle" });

  const fetchPosts = useCallback(async () => {
    try {
      setState({ status: "loading" });

      const data = await graphqlFetch<{ getAllPosts: Post[] }>(`
        query {
          getAllPosts {
            id
            content
            createdAt
            likes
            shares
            user { id name }
          }
        }
      `);

      setState({ status: "ready", posts: data.getAllPosts });
    } catch (err) {
      setState({
        status: "error",
        error: String(err),
      });
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const publish = async (content: string) => {
    if (!content.trim()) return;

    await graphqlFetch(`
      mutation {
        addPost(content: "${content.replace(/"/g, '\\"')}") { id }
      }
    `);

    await fetchPosts();
  };

  const remove = async (postId: number) => {
    await graphqlFetch(`
      mutation {
        deletePost(postId: ${postId})
      }
    `);

    await fetchPosts();
  };

  return {
    posts: state.status === "ready" ? state.posts : [],
    loading: state.status === "loading",
    error: state.status === "error" ? state.error : null,
    refresh: fetchPosts,
    publish,
    remove,
  };
}
