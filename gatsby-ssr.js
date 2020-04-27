"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _react = _interopRequireDefault(require("react"));

var _minimatch = require("minimatch");

exports.onRenderBody = function (_ref, pluginOptions) {
  var setHeadComponents = _ref.setHeadComponents,
      setPostBodyComponents = _ref.setPostBodyComponents;
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") return null; // Lighthouse recommends pre-connecting to google analytics

  setHeadComponents([/*#__PURE__*/_react.default.createElement("link", {
    rel: "preconnect dns-prefetch",
    key: "preconnect-google-analytics",
    href: "https://www.google-analytics.com"
  })]);
  var gtagConfig = pluginOptions.gtagConfig || {};
  var pluginConfig = pluginOptions.pluginConfig || {}; // Prevent duplicate or excluded pageview events being emitted on initial load of page by the `config` command
  // https://developers.google.com/analytics/devguides/collection/gtagjs/#disable_pageview_tracking

  gtagConfig.send_page_view = false;
  var firstTrackingId = pluginOptions.trackingIds && pluginOptions.trackingIds.length ? pluginOptions.trackingIds[0] : "";
  var excludeGtagPaths = [];

  if (typeof pluginConfig.exclude !== "undefined") {
    pluginConfig.exclude.map(function (exclude) {
      var mm = new _minimatch.Minimatch(exclude);
      excludeGtagPaths.push(mm.makeRe());
    });
  }

  var setComponents = pluginConfig.head ? setHeadComponents : setPostBodyComponents; // TODO: remove pluginOptions.respectDNT in the next major release of this plugin.
  // See issue https://github.com/gatsbyjs/gatsby/issues/11159 for the discussion.

  var respectDNT = pluginConfig.respectDNT || pluginOptions.respectDNT;
  var tidsByLocale = pluginOptions.trackingIdsByLocale || [];

  var getReferrer = function getReferrer() {
    return "\n    const referrer = document.referrer;\n    if (referrer !== \"\") {\n      const subdomain = referrer.split(\"/\")[2].split(\".\")[0];\n      console.log(referrer, subdomain);\n      const tids = " + JSON.stringify(tidsByLocale) + ";\n      console.log(tids);\n      const referrerLocale = tids.filter(locale => locale === subdomain)[0].code;\n      console.log(referrerLocale);\n    } else {\n      console.log('result for testing');\n      const subdomain = 'http://ca.louisvuitton.com/eng-ca/homepage'.split(\"/\")[2].split(\".\")[0];\n      console.log(referrer, subdomain);\n      const tids = " + JSON.stringify(tidsByLocale) + ";\n      console.log(tids);\n      const referrerLocale = tids.filter(locale => locale === subdomain)[0].code;\n      console.log(referrerLocale);\n    }\n  ";
  };

  var renderHtml = function renderHtml() {
    return "\n      " + (excludeGtagPaths.length ? "window.excludeGtagPaths=[" + excludeGtagPaths.join(",") + "];" : "") + "\n      " + (typeof gtagConfig.anonymize_ip !== "undefined" && gtagConfig.anonymize_ip === true ? "function gaOptout(){document.cookie=disableStr+'=true; expires=Thu, 31 Dec 2099 23:59:59 UTC;path=/',window[disableStr]=!0}var gaProperty='" + firstTrackingId + "',disableStr='ga-disable-'+gaProperty;document.cookie.indexOf(disableStr+'=true')>-1&&(window[disableStr]=!0);" : "") + "\n      if(" + (respectDNT ? "!(navigator.doNotTrack == \"1\" || window.doNotTrack == \"1\")" : "true") + ") {\n        window.dataLayer = window.dataLayer || [];\n        function gtag(){window.dataLayer && window.dataLayer.push(arguments);}\n        gtag('js', new Date());\n        " + pluginOptions.trackingIds.map(function (trackingId) {
      return "gtag('config', '" + trackingId + "', " + JSON.stringify(gtagConfig) + ");";
    }).join("") + "\n      }\n      ";
  };

  return setComponents([/*#__PURE__*/_react.default.createElement("script", {
    key: "gatsby-plugin-gtag-setup",
    dangerouslySetInnerHTML: {
      __html: getReferrer()
    }
  }), /*#__PURE__*/_react.default.createElement("script", {
    key: "gatsby-plugin-gtag",
    async: true,
    src: "https://www.googletagmanager.com/gtag/js?id=" + firstTrackingId
  }), /*#__PURE__*/_react.default.createElement("script", {
    key: "gatsby-plugin-gtag-config",
    dangerouslySetInnerHTML: {
      __html: renderHtml()
    }
  })]);
};