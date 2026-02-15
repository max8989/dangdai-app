System.register(["react/jsx-runtime", "react", "react-native", "tamagui", "expo-router", "../../hooks/useAuth", "./AppleSignInButton"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, tamagui_1, expo_router_1, useAuth_1, AppleSignInButton_1, isValidEmail;
    var __moduleName = context_1 && context_1.id;
    function LoginForm() {
        const [email, setEmail] = react_1.useState('');
        const [password, setPassword] = react_1.useState('');
        const [validationErrors, setValidationErrors] = react_1.useState({});
        const [touched, setTouched] = react_1.useState({});
        const { signIn, isLoading, error: authError, clearError } = useAuth_1.useAuth();
        // Validate individual field
        const validateField = react_1.useCallback((field, value) => {
            const errors = { ...validationErrors };
            switch (field) {
                case 'email':
                    if (!value) {
                        errors.email = undefined;
                    }
                    else if (!isValidEmail(value)) {
                        errors.email = 'Please enter a valid email';
                    }
                    else {
                        errors.email = undefined;
                    }
                    break;
                case 'password':
                    if (!value) {
                        errors.password = undefined;
                    }
                    else {
                        errors.password = undefined;
                    }
                    break;
            }
            setValidationErrors(errors);
            return errors;
        }, [validationErrors]);
        // Handle field blur (mark as touched and validate)
        const handleBlur = (field) => {
            setTouched((prev) => ({ ...prev, [field]: true }));
            const value = field === 'email' ? email : password;
            validateField(field, value);
        };
        // Handle field change
        const handleChange = (field, value) => {
            // Clear any auth errors when user starts typing
            if (authError) {
                clearError();
            }
            switch (field) {
                case 'email':
                    setEmail(value);
                    break;
                case 'password':
                    setPassword(value);
                    break;
            }
            // Validate on change if field was already touched
            if (touched[field]) {
                validateField(field, value);
            }
        };
        // Validate all fields before submit
        const validateAll = () => {
            const errors = {};
            if (!email) {
                errors.email = 'Email is required';
            }
            else if (!isValidEmail(email)) {
                errors.email = 'Please enter a valid email';
            }
            if (!password) {
                errors.password = 'Password is required';
            }
            setValidationErrors(errors);
            setTouched({ email: true, password: true });
            return Object.keys(errors).length === 0;
        };
        // Handle form submission
        const handleSubmit = async () => {
            if (!validateAll()) {
                return;
            }
            await signIn(email, password);
        };
        // Determine which error to show for email field (validation or auth error)
        const emailError = (touched.email && validationErrors.email) ||
            (authError?.field === 'email' ? authError.message : undefined);
        // Determine which error to show for password field
        const passwordError = (touched.password && validationErrors.password) ||
            (authError?.field === 'password' ? authError.message : undefined);
        const generalError = authError?.field === 'general' ? authError.message : undefined;
        return (_jsx(react_native_1.KeyboardAvoidingView, { behavior: react_native_1.Platform.OS === 'ios' ? 'padding' : 'height', style: { flex: 1 }, children: _jsx(react_native_1.ScrollView, { contentContainerStyle: { flexGrow: 1 }, keyboardShouldPersistTaps: "handled", children: _jsxs(tamagui_1.YStack, { gap: "$4", flex: 1, children: [generalError && (_jsx(tamagui_1.XStack, { backgroundColor: "$errorBackground", padding: "$3", borderRadius: "$4", borderWidth: 1, borderColor: "$errorBorder", accessibilityRole: "alert", children: _jsx(tamagui_1.Text, { color: "$error", fontSize: "$3", children: generalError }) })), _jsxs(tamagui_1.YStack, { gap: "$2", children: [_jsx(tamagui_1.Text, { fontWeight: "600", fontSize: "$3", children: "Email" }), _jsx(tamagui_1.Input, { placeholder: "your@email.com", value: email, onChangeText: (value) => handleChange('email', value), onBlur: () => handleBlur('email'), autoCapitalize: "none", autoCorrect: false, keyboardType: "email-address", textContentType: "emailAddress", autoComplete: "email", size: "$4", borderColor: emailError ? '$error' : undefined }), emailError && (_jsx(tamagui_1.Text, { color: "$error", fontSize: "$2", children: emailError }))] }), _jsxs(tamagui_1.YStack, { gap: "$2", children: [_jsxs(tamagui_1.XStack, { justifyContent: "space-between", alignItems: "center", children: [_jsx(tamagui_1.Text, { fontWeight: "600", fontSize: "$3", children: "Password" }), _jsx(expo_router_1.Link, { href: "/(auth)/forgot-password", asChild: true, children: _jsx(tamagui_1.Text, { color: "$primary", fontSize: "$3", children: "Forgot Password?" }) })] }), _jsx(tamagui_1.Input, { placeholder: "Enter your password", value: password, onChangeText: (value) => handleChange('password', value), onBlur: () => handleBlur('password'), secureTextEntry: true, textContentType: "password", autoComplete: "password", size: "$4", borderColor: passwordError ? '$error' : undefined }), passwordError && (_jsx(tamagui_1.Text, { color: "$error", fontSize: "$2", children: passwordError }))] }), _jsx(tamagui_1.Button, { size: "$5", theme: "primary", onPress: handleSubmit, disabled: isLoading, opacity: isLoading ? 0.7 : 1, marginTop: "$2", children: isLoading ? (_jsxs(tamagui_1.XStack, { gap: "$2", alignItems: "center", children: [_jsx(tamagui_1.Spinner, { size: "small" }), _jsx(tamagui_1.Text, { children: "Signing in..." })] })) : ('Sign In') }), react_native_1.Platform.OS === 'ios' && (_jsxs(tamagui_1.XStack, { alignItems: "center", gap: "$3", marginTop: "$4", children: [_jsx(tamagui_1.Separator, { flex: 1 }), _jsx(tamagui_1.Text, { color: "$colorSubtle", fontSize: "$2", children: "or continue with" }), _jsx(tamagui_1.Separator, { flex: 1 })] })), _jsx(AppleSignInButton_1.AppleSignInButton, {}), _jsx(tamagui_1.XStack, { justifyContent: "center", marginTop: "$4", children: _jsx(expo_router_1.Link, { href: "/(auth)/signup", asChild: true, children: _jsx(tamagui_1.Text, { color: "$primary", fontWeight: "600", children: "Don't have an account? Sign Up" }) }) })] }) }) }));
    }
    exports_1("LoginForm", LoginForm);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (tamagui_1_1) {
                tamagui_1 = tamagui_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (useAuth_1_1) {
                useAuth_1 = useAuth_1_1;
            },
            function (AppleSignInButton_1_1) {
                AppleSignInButton_1 = AppleSignInButton_1_1;
            }
        ],
        execute: function () {
            // Validation helpers
            isValidEmail = (email) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            };
        }
    };
});
