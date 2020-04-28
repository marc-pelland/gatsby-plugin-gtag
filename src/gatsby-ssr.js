import React from "react"
import { Minimatch } from "minimatch"

exports.onRenderBody = (
  { setHeadComponents, setPostBodyComponents },
  pluginOptions
) => {
  if (process.env.NODE_ENV !== `production` && process.env.NODE_ENV !== `test`)
    return null

  // Lighthouse recommends pre-connecting to google analytics
  setHeadComponents([
    <link
      rel="preconnect dns-prefetch"
      key="preconnect-google-analytics"
      href="https://www.google-analytics.com"
    />,
  ])

  const gtagConfig = pluginOptions.gtagConfig || {}
  const pluginConfig = pluginOptions.pluginConfig || {}

  // Prevent duplicate or excluded pageview events being emitted on initial load of page by the `config` command
  // https://developers.google.com/analytics/devguides/collection/gtagjs/#disable_pageview_tracking

  gtagConfig.send_page_view = false

  const firstTrackingId =
    pluginOptions.trackingIds && pluginOptions.trackingIds.length
      ? pluginOptions.trackingIds[0]
      : ``

  const excludeGtagPaths = []
  if (typeof pluginConfig.exclude !== `undefined`) {
    pluginConfig.exclude.map(exclude => {
      const mm = new Minimatch(exclude)
      excludeGtagPaths.push(mm.makeRe())
    })
  }

  const setComponents = pluginConfig.head
    ? setHeadComponents
    : setPostBodyComponents

  // TODO: remove pluginOptions.respectDNT in the next major release of this plugin.
  // See issue https://github.com/gatsbyjs/gatsby/issues/11159 for the discussion.
  const respectDNT = pluginConfig.respectDNT || pluginOptions.respectDNT
  const tidsByLocale = pluginOptions.trackingIdsByLocale || [];
  
  const getReferrer = () => `
    const referrer = document.referrer;
    window.referrerCode = "";
    if (referrer !== "") {
      const subdomain = referrer.split("/")[2].split(".")[0];
      console.log(referrer, subdomain);
      const tids = ${JSON.stringify(tidsByLocale)};
      console.log(tids);
      window.referrerCode = tids.filter(locale => locale.subdomain === subdomain)[0].code;
    } else {
      console.log('result for default domain - ${pluginOptions.testDomain}');
      const subdomain = "${pluginOptions.testDomain}".split("/")[2].split(".")[0];
      const tids = ${JSON.stringify(tidsByLocale)};
      window.referrerCode = tids.filter(locale => locale.subdomain === subdomain)[0].code;
    }
  `

  const renderHtml = () => `
      ${
        excludeGtagPaths.length
          ? `window.excludeGtagPaths=[${excludeGtagPaths.join(`,`)}];`
          : ``
      }
      ${
        typeof gtagConfig.anonymize_ip !== `undefined` &&
        gtagConfig.anonymize_ip === true
          ? `function gaOptout(){document.cookie=disableStr+'=true; expires=Thu, 31 Dec 2099 23:59:59 UTC;path=/',window[disableStr]=!0}var gaProperty='${firstTrackingId}',disableStr='ga-disable-'+gaProperty;document.cookie.indexOf(disableStr+'=true')>-1&&(window[disableStr]=!0);`
          : ``
      }
      if(${
        respectDNT
          ? `!(navigator.doNotTrack == "1" || window.doNotTrack == "1")`
          : `true`
      }) {
        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer && window.dataLayer.push(arguments);}
        gtag('js', new Date());
        ${pluginOptions.trackingIds
          .map(
            trackingId =>
              `gtag('config', '${trackingId}', ${JSON.stringify(gtagConfig)});`
          )
          .join(``)}
      }
      `

  return setComponents([
    <script
      key={`gatsby-plugin-gtag-setup`}
      dangerouslySetInnerHTML={{ __html: getReferrer() }}
    />,
    <script
      key={`gatsby-plugin-gtag`}
      async
      src={`https://www.googletagmanager.com/gtag/js?id=${firstTrackingId}`}
    />,
    <script
      key={`gatsby-plugin-gtag-config`}
      dangerouslySetInnerHTML={{ __html: renderHtml() }}
    />,
  ])
}