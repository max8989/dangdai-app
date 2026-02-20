import { Tabs } from 'expo-router'
import { useTheme } from 'tamagui'
import { Home, Settings, BookOpen, Palette } from '@tamagui/lucide-icons'

export default function TabLayout() {
  const theme = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary.val,
        tabBarStyle: {
          backgroundColor: theme.background.val,
          borderTopColor: theme.borderColor.val,
        },
        headerStyle: {
          backgroundColor: theme.background.val,
          borderBottomColor: theme.borderColor.val,
        },
        headerTintColor: theme.color.val,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color as never} />,
        }}
      />
      <Tabs.Screen
        name="books"
        options={{
          title: 'Books',
          tabBarIcon: ({ color }) => <BookOpen color={color as never} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color as never} />,
        }}
      />
      <Tabs.Screen
        name="theme-demo"
        options={{
          title: 'Theme Demo',
          tabBarIcon: ({ color }) => <Palette color={color as never} />,
        }}
      />
    </Tabs>
  )
}
