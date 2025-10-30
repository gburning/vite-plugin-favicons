import type { Plugin as VitePlugin } from "vite"
import { favicons, type FaviconOptions, type FaviconResponse } from "favicons"
import { extname } from "node:path"

type FaviconSource = Parameters<typeof favicons>[0]

const EXT_CONTENT_TYPES: Record<string, string> = {
    ".ico": "image/x-icon",
    ".json": "application/json",
    ".png": "image/png",
    ".xml": "application/xml",
}

function createFaviconsPlugin(
    source: FaviconSource,
    options: FaviconOptions
): VitePlugin {
    // TODO: Change plugin to do this on buildStart and whenever a watched file matches `source`
    let faviconsRes: Promise<FaviconResponse> = favicons(source, options)
    let command: "build" | "serve"

    return {
        name: "favicons",

        configResolved(config) {
            command = config.command
        },
        async configureServer(server) {
            if (command !== "serve") return

            const { images, files } = await faviconsRes
            const assetUrlMap = new Map(
                [files, images]
                    .flat(1)
                    .map((asset) => [`/${asset.name}`, asset])
            )

            server.middlewares.use((req, res, next) => {
                const asset = assetUrlMap.get(req.url ?? "")
                if (!asset) {
                    return next()
                }

                const contentType =
                    EXT_CONTENT_TYPES[extname(asset.name)] ?? "text/plain"

                res.setHeader("Content-Type", contentType)
                res.write(asset.contents, "utf8")
            })
        },
        async generateBundle() {
            if (command !== "build") return

            const { images, files } = await faviconsRes
            const assets = [files, images].flat(1)

            assets.forEach(({ name, contents }) => {
                this.emitFile({
                    type: "asset",
                    fileName: name,
                    source: contents,
                })
            })
        },
        async transformIndexHtml(html) {
            const { html: favicon } = await faviconsRes
            return html.replace("<!-- FAVICONS -->", favicon.join("\n"))
        },
    }
}

export default createFaviconsPlugin
