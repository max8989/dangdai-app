System.register(["@react-native-async-storage/async-storage", "react-native", "@supabase/supabase-js"], function (exports_1, context_1) {
    "use strict";
    var async_storage_1, react_native_1, supabase_js_1, supabaseUrl, supabaseAnonKey, getStorage, supabase;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (async_storage_1_1) {
                async_storage_1 = async_storage_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (supabase_js_1_1) {
                supabase_js_1 = supabase_js_1_1;
            }
        ],
        execute: function () {
            supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
            supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
            }
            // Storage adapter that works across platforms
            // AsyncStorage is used for React Native (iOS/Android)
            // localStorage is used for web (AsyncStorage polyfills to localStorage on web)
            getStorage = () => {
                if (react_native_1.Platform.OS === 'web') {
                    // For web, check if we're in a browser environment
                    if (typeof window !== 'undefined' && window.localStorage) {
                        return {
                            getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
                            setItem: (key, value) => {
                                window.localStorage.setItem(key, value);
                                return Promise.resolve();
                            },
                            removeItem: (key) => {
                                window.localStorage.removeItem(key);
                                return Promise.resolve();
                            },
                        };
                    }
                    // During SSR, return a no-op storage
                    return {
                        getItem: () => Promise.resolve(null),
                        setItem: () => Promise.resolve(),
                        removeItem: () => Promise.resolve(),
                    };
                }
                // For native platforms, use AsyncStorage
                return async_storage_1.default;
            };
            exports_1("supabase", supabase = supabase_js_1.createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    storage: getStorage(),
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: false, // Important for React Native
                },
            }));
        }
    };
});
