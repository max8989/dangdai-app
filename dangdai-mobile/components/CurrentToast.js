System.register(["react/jsx-runtime", "@tamagui/toast", "tamagui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, toast_1, tamagui_1;
    var __moduleName = context_1 && context_1.id;
    function CurrentToast() {
        const currentToast = toast_1.useToastState();
        if (!currentToast || currentToast.isHandledNatively)
            return null;
        return (_jsx(toast_1.Toast, { duration: currentToast.duration, viewportName: currentToast.viewportName, enterStyle: { opacity: 0, scale: 0.5, y: -25 }, exitStyle: { opacity: 0, scale: 1, y: -20 }, y: tamagui_1.isWeb ? '$12' : 0, theme: "accent", rounded: "$6", transition: "quick", children: _jsxs(tamagui_1.YStack, { items: "center", p: "$2", gap: "$2", children: [_jsx(toast_1.Toast.Title, { fontWeight: "bold", children: currentToast.title }), !!currentToast.message && (_jsx(toast_1.Toast.Description, { children: currentToast.message }))] }) }, currentToast.id));
    }
    exports_1("CurrentToast", CurrentToast);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (toast_1_1) {
                toast_1 = toast_1_1;
            },
            function (tamagui_1_1) {
                tamagui_1 = tamagui_1_1;
            }
        ],
        execute: function () {
        }
    };
});
