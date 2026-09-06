export type BackendLanguage = "en" | "tr" | "de";

export type VerificationEmailCopy = {
    subject: string;
    title: string;
    greeting: string;
    intro: string;
    button: string;
    copyLink: string;
    fallback: string;
    manualToken: string;
};

export type VerificationPageCopy = {
    verifiedTitle: string;
    verifiedMessage: string;
    alreadyVerifiedMessage: string;
    expiredTitle: string;
    expiredResentMessage: string;
    expiredThrottledMessage: string;
    expiredDeliveryFailedMessage: string;
    invalidTitle: string;
    invalidMessage: string;
};

type AuthI18n = {
    verificationEmail: VerificationEmailCopy;
    verificationPage: VerificationPageCopy;
};

const AUTH_I18N: Record<BackendLanguage, AuthI18n> = {
    en: {
        verificationEmail: {
            subject: "Verify your email",
            title: "Verify your email",
            greeting: "Hi",
            intro: "please verify your email to complete account setup.",
            button: "Verify Email",
            copyLink: "If the button doesn't work, copy this link:",
            fallback: "Manual token fallback",
            manualToken: "Manual token fallback",
        },
        verificationPage: {
            verifiedTitle: "Email verified",
            verifiedMessage: "Your email has been verified. You can return to the app and log in.",
            alreadyVerifiedMessage: "Your email was already verified. You can return to the app and log in.",
            expiredTitle: "Link expired",
            expiredResentMessage: "This verification link has expired. We sent a new verification email. Please check your inbox.",
            expiredThrottledMessage: "This verification link has expired. Please wait briefly before trying again.",
            expiredDeliveryFailedMessage: "This verification link has expired, and we could not send a new verification email right now. Please try again shortly.",
            invalidTitle: "Verification failed",
            invalidMessage: "This verification link is invalid or already used.",
        },
    },
    tr: {
        verificationEmail: {
            subject: "E-postanı doğrula",
            title: "E-postanı doğrula",
            greeting: "Merhaba",
            intro: "hesap kurulumunu tamamlamak için lütfen e-postanı doğrula.",
            button: "E-postayı Doğrula",
            copyLink: "Buton çalışmazsa bu bağlantıyı kopyala:",
            fallback: "Manuel token yedeği",
            manualToken: "Manuel token yedeği",
        },
        verificationPage: {
            verifiedTitle: "E-posta doğrulandı",
            verifiedMessage: "E-postan doğrulandı. Uygulamaya geri dönüp giriş yapabilirsin.",
            alreadyVerifiedMessage: "E-postan zaten doğrulanmış. Uygulamaya geri dönüp giriş yapabilirsin.",
            expiredTitle: "Bağlantının süresi doldu",
            expiredResentMessage: "Bu doğrulama bağlantısının süresi doldu. Yeni bir doğrulama e-postası gönderdik. Lütfen gelen kutunu kontrol et.",
            expiredThrottledMessage: "Bu doğrulama bağlantısının süresi doldu. Lütfen tekrar denemeden önce biraz bekle.",
            expiredDeliveryFailedMessage: "Bu doğrulama bağlantısının süresi doldu ve şu anda yeni bir doğrulama e-postası gönderemedik. Lütfen kısa süre sonra tekrar dene.",
            invalidTitle: "Doğrulama başarısız",
            invalidMessage: "Bu doğrulama bağlantısı geçersiz veya zaten kullanılmış.",
        },
    },
    de: {
        verificationEmail: {
            subject: "E-Mail bestätigen",
            title: "E-Mail bestätigen",
            greeting: "Hallo",
            intro: "bitte bestätige deine E-Mail, um die Kontoerstellung abzuschließen.",
            button: "E-Mail bestätigen",
            copyLink: "Falls die Schaltfläche nicht funktioniert, kopiere diesen Link:",
            fallback: "Manueller Token-Fallback",
            manualToken: "Manueller Token-Fallback",
        },
        verificationPage: {
            verifiedTitle: "E-Mail bestätigt",
            verifiedMessage: "Deine E-Mail wurde bestätigt. Du kannst zur App zurückkehren und dich anmelden.",
            alreadyVerifiedMessage: "Deine E-Mail war bereits bestätigt. Du kannst zur App zurückkehren und dich anmelden.",
            expiredTitle: "Link abgelaufen",
            expiredResentMessage: "Dieser Bestätigungslink ist abgelaufen. Wir haben eine neue Bestätigungs-E-Mail gesendet. Bitte überprüfe deinen Posteingang.",
            expiredThrottledMessage: "Dieser Bestätigungslink ist abgelaufen. Bitte warte kurz, bevor du es erneut versuchst.",
            expiredDeliveryFailedMessage: "Dieser Bestätigungslink ist abgelaufen, und wir konnten gerade keine neue Bestätigungs-E-Mail senden. Bitte versuche es in Kürze erneut.",
            invalidTitle: "Bestätigung fehlgeschlagen",
            invalidMessage: "Dieser Bestätigungslink ist ungültig oder wurde bereits verwendet.",
        },
    },
};

export function normalizeBackendLanguage(language?: string): BackendLanguage {
    return language === "tr" || language === "de" ? language : "en";
}

export function getAuthI18n(language?: string): AuthI18n {
    return AUTH_I18N[normalizeBackendLanguage(language)];
}