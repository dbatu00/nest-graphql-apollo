export type VerificationLinkStatus = "verified" | "expired_resent" | "expired_throttled" | "invalid";

export type VerificationLinkResult = {
    status: VerificationLinkStatus;
    retryAfterSeconds?: number;
};
