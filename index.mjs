import configureServer from './hooks/configureServer.cjs'
import generateBundle from './hooks/generateBundle.cjs'
import transformIndexHtml from './hooks/transformIndexHtml.cjs'
import generateFavicons from './lib/generateFavicons.cjs'
import outputMiddleware from './lib/outputMiddleware.cjs'

function createFaviconsPlugin(src, options) {
  const icons = generateFavicons(src, options)
  let command

  return {
    name: 'favicons',

    async configResolved(config) {
      command = config.command
    },

    configureServer: configureServer(icons, outputMiddleware),
    transformIndexHtml: generateBundle(icons),
    generateBundle: transformIndexHtml(icons, command),
  }
}

export default createFaviconsPlugin
