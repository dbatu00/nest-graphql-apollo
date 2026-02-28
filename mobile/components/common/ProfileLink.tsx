import { Text, TouchableOpacity } from "react-native";
import { useRouter, usePathname } from "expo-router";

type Props = {
  username: string;
  children?: React.ReactNode;
  onNavigate?: () => void;
};

export function ProfileLink({ username, children, onNavigate }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const handlePress = () => {
    // Call onNavigate immediately (closes modal)
    if (onNavigate) {
      onNavigate();
    }

    // Navigate after a brief moment
    setTimeout(() => {
      if (pathname !== `/profile/${username}`) {
        router.push({
          pathname: "/profile/[username]",
          params: { username },
        });
      }
    }, 100);
  };

  return (
    <TouchableOpacity activeOpacity={0.6} onPress={handlePress}>
      {children !== undefined && children !== null ? (
        children
      ) : (
        <Text style={{ fontWeight: "600" }}>
          {`@${username}`}
        </Text>
      )}
    </TouchableOpacity>
  );
}
