import { Platform, StyleSheet } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase } from '../../lib/supabase'

export function AppleSignInButton() {
  if (Platform.OS === 'ios')
    return (
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={8}
        style={styles.button}
        onPress={async () => {
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            })
            // Sign in via Supabase Auth.
            if (credential.identityToken) {
              const {
                error,
                data: { user },
              } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
              })
              console.log(JSON.stringify({ error, user }, null, 2))
              if (!error) {
                // Apple only provides the user's full name on the first sign-in
                // Save it to user metadata if available
                if (credential.fullName) {
                  const nameParts: string[] = []
                  if (credential.fullName.givenName)
                    nameParts.push(credential.fullName.givenName)
                  if (credential.fullName.middleName)
                    nameParts.push(credential.fullName.middleName)
                  if (credential.fullName.familyName)
                    nameParts.push(credential.fullName.familyName)

                  const fullName = nameParts.join(' ')

                  await supabase.auth.updateUser({
                    data: {
                      full_name: fullName,
                      given_name: credential.fullName.givenName,
                      family_name: credential.fullName.familyName,
                    },
                  })
                }
                // User is signed in.
              }
            } else {
              throw new Error('No identityToken.')
            }
          } catch (e: unknown) {
            const err = e as { code?: string }
            if (err.code === 'ERR_REQUEST_CANCELED') {
              // handle that the user canceled the sign-in flow
            } else {
              // handle other errors
            }
          }
        }}
      />
    )

  // On Android/web, don't render anything (Apple Sign-In is iOS only per AC #2)
  return null
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
  },
})
