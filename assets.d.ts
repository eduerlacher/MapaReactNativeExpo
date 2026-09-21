// manejo para tratamento de .html como asset
declare module '*.html' {
  const assetModule: number;
  export default assetModule;
}