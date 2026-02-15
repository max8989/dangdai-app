System.register(["react/jsx-runtime", "react", "react-native", "tamagui", "expo-router", "../../hooks/useAuth"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, tamagui_1, expo_router_1, useAuth_1, isValidEmail;
    var __moduleName = context_1 && context_1.id;
    function ForgotPasswordForm() {
        const [email, setEmail] = react_1.useState('');
        const [validationError, setValidationError] = react_1.useState();
        const [touched, setTouched] = react_1.useState(false);
        const [emailSent, setEmailSent] = react_1.useState(false);
        const { resetPassword, isLoading, error: authError, clearError } = useAuth_1.useAuth();
        // Validate email field
        const validateEmail = react_1.useCallback((value) => {
            if (!value) {
                setValidationError(undefined);
            }
            else if (!isValidEmail(value)) {
                setValidationError('Please enter a valid email');
            }
            else {
                setValidationError(undefined);
            }
        }, []);
        // Handle field blur
        const handleBlur = () => {
            setTouched(true);
            validateEmail(email);
        };
        // Handle email change
        const handleChange = (value) => {
            if (authError) {
                clearError();
            }
            setEmail(value);
            if (touched) {
                validateEmail(value);
            }
        };
        // Validate before submit
        const validateAll = () => {
            if (!email) {
                setValidationError('Email is required');
                setTouched(true);
                return false;
            }
            if (!isValidEmail(email)) {
                setValidationError('Please enter a valid email');
                setTouched(true);
                return false;
            }
            return true;
        };
        // Handle form submission
        const handleSubmit = async () => {
            if (!validateAll()) {
                return;
            }
            const success = await resetPassword(email);
            if (success) {
                setEmailSent(true);
            }
        };
        // Determine which error to show
        const emailError = (touched && validationError) ||
            (authError?.field === 'email' ? authError.message : undefined);
        const generalError = authError?.field === 'general' ? authError.message : undefined;
        // Success state - show confirmation message
        if (emailSent) {
            return (_jsxs(tamagui_1.YStack, { gap: "$6", flex: 1, paddingTop: "$4", children: [_jsxs(tamagui_1.YStack, { backgroundColor: "$successBackground", padding: "$4", borderRadius: "$4", borderWidth: 1, borderColor: "$successBorder", gap: "$2", children: [_jsx(tamagui_1.Text, { color: "$successText", fontWeight: "600", fontSize: "$5", children: "Check your email" }), _jsx(tamagui_1.Text, { color: "$success", fontSize: "$3", children: "Reset link sent to your email" }), _jsx(tamagui_1.Text, { color: "$colorSubtle", fontSize: "$2", marginTop: "$2", children: "If an account exists with this email, you will receive password reset instructions shortly. Check your spam folder if you don't see it." })] }), _jsx(expo_router_1.Link, { href: "/(auth)/login", asChild: true, children: _jsx(tamagui_1.Button, { size: "$5", theme: "primary", children: "Back to Login" }) })] }));
        }
        return (_jsx(react_native_1.KeyboardAvoidingView, { behavior: react_native_1.Platform.OS === 'ios' ? 'padding' : 'height', style: { flex: 1 }, children: _jsx(react_native_1.ScrollView, { contentContainerStyle: { flexGrow: 1 }, keyboardShouldPersistTaps: "handled", children: _jsxs(tamagui_1.YStack, { gap: "$4", flex: 1, children: [generalError && (_jsx(tamagui_1.XStack, { backgroundColor: "$errorBackground", padding: "$3", borderRadius: "$4", borderWidth: 1, borderColor: "$errorBorder", accessibilityRole: "alert", children: _jsx(tamagui_1.Text, { color: "$error", fontSize: "$3", children: generalError }) })), _jsxs(tamagui_1.YStack, { gap: "$2", children: [_jsx(tamagui_1.Text, { fontWeight: "600", fontSize: "$3", children: "Email" }), _jsx(tamagui_1.Input, { placeholder: "your@email.com", value: email, onChangeText: handleChange, onBlur: handleBlur, autoCapitalize: "none", autoCorrect: false, keyboardType: "email-address", textContentType: "emailAddress", autoComplete: "email", size: "$4", borderColor: emailError ? '$error' : undefined }), emailError && (_jsx(tamagui_1.Text, { color: "$error", fontSize: "$2", children: emailError }))] }), _jsx(tamagui_1.Button, { size: "$5", theme: "primary", onPress: handleSubmit, disabled: isLoading, opacity: isLoading ? 0.7 : 1, marginTop: "$2", children: isLoading ? (_jsxs(tamagui_1.XStack, { gap: "$2", alignItems: "center", children: [_jsx(tamagui_1.Spinner, { size: "small" }), _jsx(tamagui_1.Text, { children: "Sending..." })] })) : ('Send Reset Link') }), _jsx(tamagui_1.XStack, { justifyContent: "center", marginTop: "$4", children: _jsx(expo_router_1.Link, { href: "/(auth)/login", asChild: true, children: _jsx(tamagui_1.Text, { color: "$primary", fontWeight: "600", children: "Back to Login" }) }) })] }) }) }));
    }
    exports_1("ForgotPasswordForm", ForgotPasswordForm);
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
