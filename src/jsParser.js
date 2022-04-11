/**
 * JS文件解析
 */
const babelParser = require("@babel/parser");
const babelTypes = require("@babel/types");
const babelTraverse = require("@babel/traverse").default;
const utils = require("./utils");
const fs = require("fs");
const path = require("path");

/** 解析js内使用的api
 * @param {string} filePath 文件路径
 * @param {object} alias 别名配置
 */
function getJsConfig(filePath, alias) {
  const arr = {
    path: filePath,
    imports: [],
    functions: [],
  };

  const fileData = fs.readFileSync(filePath, "utf8");

  const ast = babelParser.parse(fileData, {
    sourceType: "module",
  });

  const currentItem = () => {
    return arr.functions[arr.functions.length - 1];
  };

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

    FunctionDeclaration(nodePath) {
      const node = nodePath.node;
      arr.functions.push({
        name: node.id.name,
        call: [],
      });

      // 跳过子节点
      nodePath.skip();

      // 寻找子节点函数调用
      babelTraverse(
        node,
        {
          CallExpression(nodePath) {
            const node = nodePath.node;
            if (node.callee.name) {
              currentItem().call.push(node.callee.name);
            }
          },
        },
        {}
      );
    },
  });

  return arr;
}

module.exports = {
  getJsConfig,
};
