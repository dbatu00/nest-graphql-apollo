export type VerificationLinkResult = {
    status: "verified" | "expired_resent" | "expired_throttled" | "expired_delivery_failed" | "invalid";
};
