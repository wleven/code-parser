const apiConfig = require("./apiParser");
const vueParser = require("./vueParser");
const jsParser = require("./jsParser");
const storeParser = require("./storeParser");
const fileDependency = require("./fileDependency");
const path = require("path");
const utils = require("./utils");
const fs = require("fs");

/** 别名 */
const alias = {
  "@": "E:\\project\\olsl-back\\src",
};

/** 路径补全 */
const extensions = [".js", ".vue"];

function getApiConfig() {
  console.log("解析API配置");
  const fileList = utils.getFilePath("E:\\project\\olsl-back\\src\\api", [
    ".js",
  ]);

  const config = [];

  fileList.map((item) => {
    config.push(apiConfig.getApiConfig(item));
  });

  const filePath = path.resolve("src/file/apiConfig.json");

  fs.writeFileSync(filePath, JSON.stringify(config));
  console.log(`写入API配置 --- ${filePath}`);

  // const apiConfigMap = apiConfig.formatMap(apiConfigList);
}

function getVueFileConfig() {
  console.log("解析VUE文件");
  const fileList = utils.getFilePath(
    "E:\\project\\olsl-back\\src",
    [".vue"],
    [/src\\assets/, /src\\styles/, /src\\store/]
  );

  let config = [];

  fileList.map((item) => {
    config.push(vueParser.getVueConfig(item, alias));
  });

  config = config.filter(
    (item) => item && (item.store.length !== 0 || item.imports.length !== 0)
  );

  const filePath = path.resolve("src/file/vueConfig.json");

  fs.writeFileSync(filePath, JSON.stringify(config));
  console.log(`写入vue配置 --- ${filePath}`);
}

function getJsFileConfig() {
  console.log("解析JS文件");
  const fileList = utils.getFilePath(
    "E:\\project\\olsl-back\\src",
    [".js"],
    [/src\\api/, /src\\route/, /src\\assets/, /src\\styles/, /src\\store/]
  );

  let config = [];

  fileList.map((item) => {
    config.push(jsParser.getJsConfig(item, alias));
  });

  config = config.filter((item) => {
    // 过滤没有函数调用的fun
    item.functions = item.functions.filter((item) => item.call.length > 0);
    // 过滤没有import 和export function的item
    return item.imports.length > 0 && item.functions.length > 0;
  });

  const filePath = path.resolve("src/file/jsConfig.json");
  fs.writeFileSync(filePath, JSON.stringify(config));

  console.log(`写入js配置 --- ${filePath}`);
}

function getStoreConfig() {
  console.log("解析vuex");
  const config = storeParser.getStoreConfig(
    "E:\\project\\olsl-back\\src\\store\\modules\\authorize\\addGoods.js",
    alias,
    (path) => {
      return /src\\api/.test(path);
    }
  );

  const filePath = path.resolve("src/file/storeConfig.json");
  fs.writeFileSync(filePath, JSON.stringify(config));
  console.log(`写入store配置 --- ${filePath}`);
}

getApiConfig();
getVueFileConfig();
getJsFileConfig();
getStoreConfig();
