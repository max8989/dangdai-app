System.register(["react/jsx-runtime", "expo-router", "tamagui", "@tamagui/lucide-icons"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, expo_router_1, tamagui_1, lucide_icons_1;
    var __moduleName = context_1 && context_1.id;
    function TabLayout() {
        const theme = tamagui_1.useTheme();
        return (_jsxs(expo_router_1.Tabs, { screenOptions: {
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
            }, children: [_jsx(expo_router_1.Tabs.Screen, { name: "index", options: {
                        title: 'Home',
                        tabBarIcon: ({ color }) => _jsx(lucide_icons_1.Home, { color: color }),
                    } }), _jsx(expo_router_1.Tabs.Screen, { name: "books", options: {
                        title: 'Books',
                        tabBarIcon: ({ color }) => _jsx(lucide_icons_1.BookOpen, { color: color }),
                    } }), _jsx(expo_router_1.Tabs.Screen, { name: "settings", options: {
                        title: 'Settings',
                        tabBarIcon: ({ color }) => _jsx(lucide_icons_1.Settings, { color: color }),
                    } })] }));
    }
    exports_1("default", TabLayout);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (tamagui_1_1) {
                tamagui_1 = tamagui_1_1;
            },
            function (lucide_icons_1_1) {
                lucide_icons_1 = lucide_icons_1_1;
            }
        ],
        execute: function () {
        }
    };
});
