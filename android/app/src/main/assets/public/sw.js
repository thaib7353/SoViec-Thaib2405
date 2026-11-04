/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "bbe3a3e4270524ec72d3fde3cae8ec7b"
  }, {
    "url": "pwa-512x512.png",
    "revision": "bbe3a3e4270524ec72d3fde3cae8ec7b"
  }, {
    "url": "pwa-192x192.png",
    "revision": "a25cca8dd8c7a48e6f4ff3742a12f0fc"
  }, {
    "url": "index.html",
    "revision": "e8dc0ee640b54677fd08648d8466bbce"
  }, {
    "url": "icon.svg",
    "revision": "2386d098e87b06bba42ee4781a08f6b0"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "1a9086f0432016284a6308caae2beeec"
  }, {
    "url": "assets/web-C3pAXSiz.js",
    "revision": null
  }, {
    "url": "assets/web-Bn8lrcxj.js",
    "revision": null
  }, {
    "url": "assets/index-DSAKkbwx.css",
    "revision": null
  }, {
    "url": "assets/index-BKXW7S9l.js",
    "revision": null
  }, {
    "url": "assets/aistudio/image_d560bf25.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_b3542a43.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_58cf01de.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_415ed651.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_0136d131.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "1a9086f0432016284a6308caae2beeec"
  }, {
    "url": "icon.svg",
    "revision": "2386d098e87b06bba42ee4781a08f6b0"
  }, {
    "url": "pwa-192x192.png",
    "revision": "a25cca8dd8c7a48e6f4ff3742a12f0fc"
  }, {
    "url": "pwa-512x512.png",
    "revision": "bbe3a3e4270524ec72d3fde3cae8ec7b"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "bbe3a3e4270524ec72d3fde3cae8ec7b"
  }, {
    "url": "manifest.webmanifest",
    "revision": "16e4448fc6de7d7cb696522b0e8114ba"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
