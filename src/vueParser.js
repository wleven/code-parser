/**
 * 获取vue组件的API调用
 */
const babelParser = require("@babel/parser");
const babelTypes = require("@babel/types");
const babelTraverse = require("@babel/traverse").default;
const compiler = require("vue-template-compiler");
const utils = require("./utils");
const fs = require("fs");
const path = require("path");

/** 解析组件内使用的api
 * @param {string} filePath 文件路径
 * @param {object} alias 别名配置
 */
function getVueConfig(filePath, alias) {
  const arr = {
    path: filePath,
    imports: [],
    store: [],
  };

  const fileData = fs.readFileSync(filePath, "utf8");

  const script = compiler.parseComponent(fileData).script;

  if (!script) return undefined;

  const ast = babelParser.parse(script.content, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  babelTraverse(ast, {
    /** import 处理 */
    ImportDeclaration(nodePath) {
      const source = nodePath.node.source.value;

      arr.imports.push({
        sourcePath: utils.importPathResolve(filePath, source, alias),
        specifiers: nodePath.node.specifiers.map((item) => {
          return {
            type: item.type,
            value: item.local.name,
          };
        }),
      });
    },

    /** store调用处理 */
    CallExpression(nodePath) {
      const node = nodePath.node;
      if (node.callee.object?.property?.name === "$store") {
        arr.store.push(node.arguments[0].value);
      }
    },
  });

  return arr;
}

/** 通过路由文件获取页面列表 */
function getPageList(filePath) {
  const fileList = [];
  const fileData = fs.readFileSync(filePath, "utf8");

  const ast = babelParser.parse(fileData, {
    sourceType: "module",
  });

  // fs.writeFileSync(path.resolve(__dirname, './file/routeAst.json'), JSON.stringify(ast))

  babelTraverse(ast, {
    /** 懒加载路由 */
    ArrowFunctionExpression(path) {
      const body = path.node.body;
      if (body.callee.type === "Import") {
        if (Array.isArray(body.arguments) && body.arguments.length > 0) {
          fileList.push(getVueFilePath(body.arguments[0].value));
        }
      }
    },
  });

  return fileList;
}

/** import组件路径 转真实文件路径 */
function getVueFilePath(importPath = "") {
  if (!importPath) return;

  const p = path.parse(importPath);
  if (!p.ext) {
    p.ext = ".vue";
    p.base += p.ext;
  }

  return path.format(p).replace(/\//g, "\\").replace("@", "src");
}

/** 获取页面入口
 * @param dir api文件夹路径 如 `src/api`
 */
function getPageConfig(dir = "") {
  const fileList = utils.getFilePath(dir);
  const route = getPageList(fileList[0]);
  console.log(route);
}

module.exports = {
  getPageConfig,
  getVueConfig,
};
