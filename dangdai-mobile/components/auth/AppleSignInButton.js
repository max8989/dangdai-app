System.register(["react/jsx-runtime", "react-native", "expo-apple-authentication", "tamagui", "../../lib/supabase"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, AppleAuthentication, tamagui_1, supabase_1, styles;
    var __moduleName = context_1 && context_1.id;
    function AppleSignInButton() {
        // Use Tamagui's theme context to stay in sync with app theme
        const themeName = tamagui_1.useThemeName();
        if (react_native_1.Platform.OS === 'ios')
            return (_jsx(AppleAuthentication.AppleAuthenticationButton, { buttonType: AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN, buttonStyle: themeName === 'dark'
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK, cornerRadius: 8, style: styles.button, onPress: async () => {
                    try {
                        const credential = await AppleAuthentication.signInAsync({
                            requestedScopes: [
                                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                                AppleAuthentication.AppleAuthenticationScope.EMAIL,
                            ],
                        });
                        // Sign in via Supabase Auth.
                        if (credential.identityToken) {
                            const { error, data: { user }, } = await supabase_1.supabase.auth.signInWithIdToken({
                                provider: 'apple',
                                token: credential.identityToken,
                            });
                            console.log(JSON.stringify({ error, user }, null, 2));
                            if (!error) {
                                // Apple only provides the user's full name on the first sign-in
                                // Save it to user metadata if available
                                if (credential.fullName) {
                                    const nameParts = [];
                                    if (credential.fullName.givenName)
                                        nameParts.push(credential.fullName.givenName);
                                    if (credential.fullName.middleName)
                                        nameParts.push(credential.fullName.middleName);
                                    if (credential.fullName.familyName)
                                        nameParts.push(credential.fullName.familyName);
                                    const fullName = nameParts.join(' ');
                                    await supabase_1.supabase.auth.updateUser({
                                        data: {
                                            full_name: fullName,
                                            given_name: credential.fullName.givenName,
                                            family_name: credential.fullName.familyName,
                                        },
                                    });
                                }
                                // User is signed in.
                            }
                        }
                        else {
                            throw new Error('No identityToken.');
                        }
                    }
                    catch (e) {
                        const err = e;
                        if (err.code === 'ERR_REQUEST_CANCELED') {
                            // handle that the user canceled the sign-in flow
                        }
                        else {
                            // handle other errors
                        }
                    }
                } }));
        // On Android/web, don't render anything (Apple Sign-In is iOS only per AC #2)
        return null;
    }
    exports_1("AppleSignInButton", AppleSignInButton);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (AppleAuthentication_1) {
                AppleAuthentication = AppleAuthentication_1;
            },
            function (tamagui_1_1) {
                tamagui_1 = tamagui_1_1;
            },
            function (supabase_1_1) {
                supabase_1 = supabase_1_1;
            }
        ],
        execute: function () {
            styles = react_native_1.StyleSheet.create({
                button: {
                    width: '100%',
                    height: 48,
                },
            });
        }
    };
});
