import { Text, View } from "react-native"
import { useLocale } from "../../context/locale"

export default function ReportsScreen() {
  const { t } = useLocale()
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-2xl font-bold text-gray-900">{t.pages.reports}</Text>
    </View>
  )
}
