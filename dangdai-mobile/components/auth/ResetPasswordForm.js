System.register(["react/jsx-runtime", "react", "react-native", "tamagui", "../../hooks/useAuth"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, tamagui_1, useAuth_1, validatePasswordStrength, isValidPassword;
    var __moduleName = context_1 && context_1.id;
    function ResetPasswordForm() {
        const [password, setPassword] = react_1.useState('');
        const [confirmPassword, setConfirmPassword] = react_1.useState('');
        const [validationErrors, setValidationErrors] = react_1.useState({});
        const [touched, setTouched] = react_1.useState({});
        const { updatePassword, isLoading, error: authError, clearError } = useAuth_1.useAuth();
        // Get password strength errors for display
        const passwordStrengthErrors = validatePasswordStrength(password);
        const passwordIsValid = isValidPassword(password);
        // Validate individual field
        const validateField = react_1.useCallback((field, value) => {
            const errors = { ...validationErrors };
            switch (field) {
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
        // Handle field blur
        const handleBlur = (field) => {
            setTouched((prev) => ({ ...prev, [field]: true }));
            const value = field === 'password' ? password : confirmPassword;
            validateField(field, value);
        };
        // Handle field change
        const handleChange = (field, value) => {
            if (authError) {
                clearError();
            }
            switch (field) {
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
            setTouched({ password: true, confirmPassword: true });
            return Object.keys(errors).length === 0;
        };
        // Handle form submission
        const handleSubmit = async () => {
            if (!validateAll()) {
                return;
            }
            await updatePassword(password);
        };
        // Determine which error to show for password field
        const passwordError = (touched.password && validationErrors.password) ||
            (authError?.field === 'password' ? authError.message : undefined);
        const confirmPasswordError = touched.confirmPassword && validationErrors.confirmPassword;
        const generalError = authError?.field === 'general' ? authError.message : undefined;
        return (_jsx(react_native_1.KeyboardAvoidingView, { behavior: react_native_1.Platform.OS === 'ios' ? 'padding' : 'height', style: { flex: 1 }, children: _jsx(react_native_1.ScrollView, { contentContainerStyle: { flexGrow: 1 }, keyboardShouldPersistTaps: "handled", children: _jsxs(tamagui_1.YStack, { gap: "$4", flex: 1, children: [generalError && (_jsx(tamagui_1.XStack, { backgroundColor: "$errorBackground", padding: "$3", borderRadius: "$4", borderWidth: 1, borderColor: "$errorBorder", accessibilityRole: "alert", children: _jsx(tamagui_1.Text, { color: "$error", fontSize: "$3", children: generalError }) })), _jsxs(tamagui_1.YStack, { gap: "$2", children: [_jsx(tamagui_1.Text, { fontWeight: "600", fontSize: "$3", children: "New Password" }), _jsx(tamagui_1.Input, { placeholder: "At least 8 characters", value: password, onChangeText: (value) => handleChange('password', value), onBlur: () => handleBlur('password'), secureTextEntry: true, textContentType: "newPassword", autoComplete: "new-password", size: "$4", borderColor: passwordError ? '$error' : undefined }), passwordError && (_jsx(tamagui_1.Text, { color: "$error", fontSize: "$2", children: passwordError })), password.length > 0 && !passwordError && (_jsx(tamagui_1.YStack, { gap: "$1", children: passwordStrengthErrors.length > 0 ? (passwordStrengthErrors.map((err, i) => (_jsx(tamagui_1.Text, { color: "$warning", fontSize: "$2", children: err }, i)))) : (_jsx(tamagui_1.Text, { color: "$success", fontSize: "$2", children: "Password meets requirements" })) }))] }), _jsxs(tamagui_1.YStack, { gap: "$2", children: [_jsx(tamagui_1.Text, { fontWeight: "600", fontSize: "$3", children: "Confirm Password" }), _jsx(tamagui_1.Input, { placeholder: "Re-enter your password", value: confirmPassword, onChangeText: (value) => handleChange('confirmPassword', value), onBlur: () => handleBlur('confirmPassword'), secureTextEntry: true, textContentType: "newPassword", autoComplete: "new-password", size: "$4", borderColor: confirmPasswordError ? '$error' : undefined }), confirmPasswordError && (_jsx(tamagui_1.Text, { color: "$error", fontSize: "$2", children: confirmPasswordError }))] }), _jsx(tamagui_1.Button, { size: "$5", theme: "primary", onPress: handleSubmit, disabled: isLoading || !passwordIsValid, opacity: isLoading || !passwordIsValid ? 0.7 : 1, marginTop: "$2", children: isLoading ? (_jsxs(tamagui_1.XStack, { gap: "$2", alignItems: "center", children: [_jsx(tamagui_1.Spinner, { size: "small" }), _jsx(tamagui_1.Text, { children: "Updating..." })] })) : ('Update Password') })] }) }) }));
    }
    exports_1("ResetPasswordForm", ResetPasswordForm);
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
            function (useAuth_1_1) {
                useAuth_1 = useAuth_1_1;
            }
        ],
        execute: function () {
            // Password validation helper
            validatePasswordStrength = (password) => {
                const errors = [];
                if (password.length < 8) {
                    errors.push('At least 8 characters');
                }
                return errors;
            };
            isValidPassword = (password) => {
                return password.length >= 8;
            };
        }
    };
});
