import { StyleSheet } from 'react-native'
import { TamaguiProvider, Theme, type TamaguiProviderProps } from 'tamagui'
import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { CurrentToast } from './CurrentToast'
import { config } from '../tamagui.config'
import { queryClient } from '../lib/queryClient'
import { useResolvedColorScheme } from '../hooks/useResolvedColorScheme'

export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config' | 'defaultTheme'>) {
  const colorScheme = useResolvedColorScheme()

  return (
    <GestureHandlerRootView style={styles.root}>
      <TamaguiProvider
        config={config}
        defaultTheme={colorScheme}
        {...rest}
      >
        {/* Theme wrapper enables reactive switching -- defaultTheme alone only sets initial value */}
        <Theme name={colorScheme}>
          <QueryClientProvider client={queryClient}>
            <ToastProvider
              swipeDirection="horizontal"
              duration={12000}
              native={[
                // uncomment the next line to do native toasts on mobile. NOTE: it'll require you making a dev build and won't work with Expo Go
                // 'mobile'
              ]}
            >
              {children}
              <CurrentToast />
              <ToastViewport top="$8" left={0} right={0} />
            </ToastProvider>
          </QueryClientProvider>
        </Theme>
      </TamaguiProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
