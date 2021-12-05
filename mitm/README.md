# MITM Proxy

This folder contains addons and configuration that will inject the userscript into pages using [mitmproxy](https://mitmproxy.org/). This method doesn't require a browser extension making it usable on browsers/devices that don't support extensions (e.g. Chrome for Android or any browser for iOS), but it does require a bit of setup and comes with some downsides of its own. 

Once mitmproxy is [installed](https://docs.mitmproxy.org/stable/overview-installation/) you can start it with `pnpm run mitm`. See the [getting started docs](https://docs.mitmproxy.org/stable/overview-getting-started/) for more instructions on how to use it on your devices.

This proxy also setup the pages to be installable on mobile devices. Support/usage depends on used device/browser, but generally there will be an "install" or "add to home screen" option in the browser menu.
