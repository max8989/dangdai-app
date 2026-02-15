System.register(["react/jsx-runtime", "expo-router/html"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, html_1, responsiveBackground;
    var __moduleName = context_1 && context_1.id;
    // This file is web-only and used to configure the root HTML for every
    // web page during static rendering.
    // The contents of this function only run in Node.js environments and
    // do not have access to the DOM or browser APIs.
    function Root({ children }) {
        return (_jsxs("html", { lang: "en", children: [_jsxs("head", { children: [_jsx("meta", { charSet: "utf-8" }), _jsx("meta", { httpEquiv: "X-UA-Compatible", content: "IE=edge" }), _jsx("meta", { name: "viewport", content: "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover" }), _jsx(html_1.ScrollViewStyleReset, {}), _jsx("style", { dangerouslySetInnerHTML: { __html: responsiveBackground } })] }), _jsx("body", { children: children })] }));
    }
    exports_1("default", Root);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (html_1_1) {
                html_1 = html_1_1;
            }
        ],
        execute: function () {
            responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
        }
    };
});
