export const FEED_QUERY = `
  query Feed($username: String, $types: [String!]) {
    feed(username: $username, types: $types) {
      id
      type
      active
      createdAt

      actor {
        id
        username
        displayName
        followedByMe
      }

      targetUser {
        id
        username
        displayName
        followedByMe
      }

      targetPost {
        id
        content
        createdAt
        likesCount
        likedByMe
        user {
          id
          username
          displayName
          followedByMe
        }
      }
    }
  }
`;

export const USER_PROFILE_QUERY = `
  query UserProfile($username: String!) {
    userByUsername(username: $username) {
      id
      username
      displayName
      bio
      followersCount
      followingCount
      posts {
        id
        content
        createdAt
      }
    }
  }
`;

export const LIKED_POSTS_QUERY = `
  query LikedPosts($username: String!) {
    likedPosts(username: $username) {
      id
      content
      createdAt
      user {
        id
        username
        displayName
        followedByMe
      }
      likesCount
      likedByMe
    }
  }
`;

export const FOLLOWERS_WITH_FOLLOW_STATE_QUERY = `
  query FollowersWithFollowState($username: String!) {
    followersWithFollowState(username: $username) {
      followedByMe
      user {
        id
        username
        displayName
      }
    }
  }
`;

export const FOLLOWING_WITH_FOLLOW_STATE_QUERY = `
  query FollowingWithFollowState($username: String!) {
    followingWithFollowState(username: $username) {
      followedByMe
      user {
        id
        username
        displayName
      }
    }
  }
`;

export const ME_QUERY = `
  query {
    me {
      id
      username
      displayName
      emailVerified
    }
  }
`;

export const LOGIN_MUTATION = `
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      emailVerified
      user {
        id
        username
        displayName
      }
    }
  }
`;

export const SIGNUP_MUTATION = `
  mutation SignUp($username: String!, $email: String!, $password: String!) {
    signUp(username: $username, email: $email, password: $password) {
      token
      user {
        id
        username
        displayName
      }
      emailVerified
    }
  }
`;

export const VERIFY_EMAIL_MUTATION = `
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

export const RESEND_VERIFICATION_EMAIL_MUTATION = `
  mutation ResendMyVerificationEmail {
    resendMyVerificationEmail
  }
`;

export const FOLLOW_USER_MUTATION = `
  mutation FollowUser($username: String!) {
    followUser(username: $username)
  }
`;

export const UNFOLLOW_USER_MUTATION = `
  mutation UnfollowUser($username: String!) {
    unfollowUser(username: $username)
  }
`;

export const LIKE_POST_MUTATION = `
  mutation LikePost($postId: Int!) {
    likePost(postId: $postId)
  }
`;

export const UNLIKE_POST_MUTATION = `
  mutation UnlikePost($postId: Int!) {
    unlikePost(postId: $postId)
  }
`;

export const DELETE_POST_MUTATION = `
  mutation DeletePost($postId: Int!) {
    deletePost(postId: $postId)
  }
`;

export const ADD_POST_MUTATION = `
  mutation AddPost($content: String!) {
    addPost(content: $content) {
      id
    }
  }
`;

export const GET_LIKED_USERS_QUERY = `
  query GetLikedUsers($postId: Int!) {
    post(id: $postId) {
      likedUsers {
        id
        username
        displayName
        followedByMe
      }
    }
  }
`;

export const FOLLOWERS_QUERY = `
  query Followers($username: String!) {
    followers(username: $username) {
      id
      username
      displayName
      followedByMe
    }
  }
`;

export const FOLLOWING_QUERY = `
  query Following($username: String!) {
    following(username: $username) {
      id
      username
      displayName
      followedByMe
    }
  }
`;