System.register(["react/jsx-runtime", "react", "tamagui", "expo-router", "../../hooks/useAuth"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, tamagui_1, expo_router_1, useAuth_1, isValidEmail, isValidPassword;
    var __moduleName = context_1 && context_1.id;
    function SignupForm() {
        const [email, setEmail] = react_1.useState('');
        const [password, setPassword] = react_1.useState('');
        const [confirmPassword, setConfirmPassword] = react_1.useState('');
        const [validationErrors, setValidationErrors] = react_1.useState({});
        const [touched, setTouched] = react_1.useState({});
        const { signUp, isLoading, error: authError, clearError } = useAuth_1.useAuth();
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
                    else if (!isValidPassword(value)) {
                        errors.password = 'Password must be at least 8 characters';
                    }
                    else {
                        errors.password = undefined;
                    }
                    // Also revalidate confirm password when password changes
                    if (confirmPassword && value !== confirmPassword) {
                        errors.confirmPassword = "Passwords don't match";
                    }
                    else if (confirmPassword) {
                        errors.confirmPassword = undefined;
                    }
                    break;
                case 'confirmPassword':
                    if (!value) {
                        errors.confirmPassword = undefined;
                    }
                    else if (value !== password) {
                        errors.confirmPassword = "Passwords don't match";
                    }
                    else {
                        errors.confirmPassword = undefined;
                    }
                    break;
            }
            setValidationErrors(errors);
            return errors;
        }, [validationErrors, password, confirmPassword]);
        // Handle field blur (mark as touched and validate)
        const handleBlur = (field) => {
            setTouched((prev) => ({ ...prev, [field]: true }));
            const value = field === 'email' ? email : field === 'password' ? password : confirmPassword;
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
                case 'confirmPassword':
                    setConfirmPassword(value);
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
            else if (!isValidPassword(password)) {
                errors.password = 'Password must be at least 8 characters';
            }
            if (!confirmPassword) {
                errors.confirmPassword = 'Please confirm your password';
            }
            else if (confirmPassword !== password) {
                errors.confirmPassword = "Passwords don't match";
            }
            setValidationErrors(errors);
            setTouched({ email: true, password: true, confirmPassword: true });
            return Object.keys(errors).length === 0;
        };
        // Handle form submission
        const handleSubmit = async () => {
            if (!validateAll()) {
                return;
            }
            await signUp(email, password);
        };
        // Determine which error to show for email field (validation or auth error)
        const emailError = (touched.email && validationErrors.email) ||
            (authError?.field === 'email' ? authError.message : undefined);
        // Determine which error to show for password field
        const passwordError = (touched.password && validationErrors.password) ||
            (authError?.field === 'password' ? authError.message : undefined);
        const confirmPasswordError = touched.confirmPassword && validationErrors.confirmPassword;
        const generalError = authError?.field === 'general' ? authError.message : undefined;
        return (_jsxs(tamagui_1.YStack, { gap: "$4", flex: 1, children: [generalError && (_jsx(tamagui_1.XStack, { backgroundColor: "$errorBackground", padding: "$3", borderRadius: "$4", borderWidth: 1, borderColor: "$errorBorder", accessibilityRole: "alert", children: _jsx(tamagui_1.Text, { color: "$error", fontSize: "$3", children: generalError }) })), _jsxs(tamagui_1.YStack, { gap: "$2", children: [_jsx(tamagui_1.Text, { fontWeight: "600", fontSize: "$3", children: "Email" }), _jsx(tamagui_1.Input, { placeholder: "your@email.com", value: email, onChangeText: (value) => handleChange('email', value), onBlur: () => handleBlur('email'), autoCapitalize: "none", autoCorrect: false, keyboardType: "email-address", textContentType: "emailAddress", autoComplete: "email", size: "$4", borderColor: emailError ? '$error' : undefined }), emailError && (_jsx(tamagui_1.Text, { color: "$error", fontSize: "$2", children: emailError }))] }), _jsxs(tamagui_1.YStack, { gap: "$2", children: [_jsx(tamagui_1.Text, { fontWeight: "600", fontSize: "$3", children: "Password" }), _jsx(tamagui_1.Input, { placeholder: "At least 8 characters", value: password, onChangeText: (value) => handleChange('password', value), onBlur: () => handleBlur('password'), secureTextEntry: true, textContentType: "newPassword", autoComplete: "new-password", size: "$4", borderColor: passwordError ? '$error' : undefined }), passwordError && (_jsx(tamagui_1.Text, { color: "$error", fontSize: "$2", children: passwordError }))] }), _jsxs(tamagui_1.YStack, { gap: "$2", children: [_jsx(tamagui_1.Text, { fontWeight: "600", fontSize: "$3", children: "Confirm Password" }), _jsx(tamagui_1.Input, { placeholder: "Re-enter your password", value: confirmPassword, onChangeText: (value) => handleChange('confirmPassword', value), onBlur: () => handleBlur('confirmPassword'), secureTextEntry: true, textContentType: "newPassword", autoComplete: "new-password", size: "$4", borderColor: confirmPasswordError ? '$error' : undefined }), confirmPasswordError && (_jsx(tamagui_1.Text, { color: "$error", fontSize: "$2", children: confirmPasswordError }))] }), _jsx(tamagui_1.Button, { size: "$5", theme: "primary", onPress: handleSubmit, disabled: isLoading, opacity: isLoading ? 0.7 : 1, marginTop: "$2", children: isLoading ? (_jsxs(tamagui_1.XStack, { gap: "$2", alignItems: "center", children: [_jsx(tamagui_1.Spinner, { size: "small" }), _jsx(tamagui_1.Text, { children: "Creating account..." })] })) : ('Sign Up') }), _jsx(tamagui_1.XStack, { justifyContent: "center", marginTop: "$4", children: _jsx(expo_router_1.Link, { href: "/(auth)/login", asChild: true, children: _jsx(tamagui_1.Text, { color: "$primary", fontWeight: "600", children: "Already have an account? Sign In" }) }) })] }));
    }
    exports_1("SignupForm", SignupForm);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
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
            isValidPassword = (password) => {
                return password.length >= 8;
            };
        }
    };
});
