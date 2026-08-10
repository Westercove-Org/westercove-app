// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * jsPDF ships a node build whose conditional `require(["html2canvas"], …)` call
 * Metro cannot transform, and which static rendering pulls in. The PDF is only
 * ever built client-side (web download / native share sheet), so point every
 * platform at the browser ESM build.
 */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'jspdf') {
    return {
      filePath: require.resolve('jspdf/dist/jspdf.es.min.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
