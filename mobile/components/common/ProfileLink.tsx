import { Text, TouchableOpacity } from "react-native";
import { useRouter, usePathname } from "expo-router";

type Props = {
  username: string;
  children?: React.ReactNode;
};

export function ProfileLink({ username, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const handlePress = () => {
    if (pathname === `/profile/${username}`) return;

    router.push({
      pathname: "/profile/[username]",
      params: { username },
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.6} onPress={handlePress}>
      <Text style={{ fontWeight: "600" }}>
        {children ?? `@${username}`}
      </Text>
    </TouchableOpacity>
  );
}
