/**
 * vuex配置解析
 */
const babelParser = require("@babel/parser");
const babelTypes = require("@babel/types");
const babelTraverse = require("@babel/traverse").default;
const utils = require("./utils");
const fs = require("fs");
const path = require("path");

/** 解析store内使用的api
 * @param {string} filePath 文件路径
 * @param {object} alias 别名配置
 * @param {(path:string)=>boolean} importFilter import过滤
 */
function getStoreConfig(filePath, alias, importFilter = () => true) {
  const arr = {
    path: filePath,
    imports: [],
    actions: [],
  };

  const fileData = fs.readFileSync(filePath, "utf8");

  const ast = babelParser.parse(fileData, {
    sourceType: "module",
  });

  const currentItem = () => {
    return arr.actions[arr.actions.length - 1];
  };

  babelTraverse(ast, {
    /** import 处理 */
    ImportDeclaration(nodePath) {
      const source = nodePath.node.source.value;
      const sourcePath = utils.importPathResolve(filePath, source, alias);
      if (importFilter(sourcePath)) {
        arr.imports.push({
          sourcePath: sourcePath,
          specifiers: nodePath.node.specifiers.map((item) => {
            return {
              type: item.type,
              value: item.local.name,
            };
          }),
        });
      }
    },

    /** actions声明 */
    VariableDeclarator(nodePath) {
      if (nodePath.node.id?.name !== "actions") return;
      console.log(nodePath.node.id?.name);
      const node = nodePath.node;

      // 跳过子节点
      nodePath.skip();

      // 子节点函数声明
      babelTraverse(
        node,
        {
          ObjectMethod(nodePath) {
            const node = nodePath.node;

            arr.actions.push({
              name: nodePath.node.key.name,
              call: [],
            });

            // 跳过子节点
            nodePath.skip();

            // 子节点函数调用
            babelTraverse(
              node,
              {
                CallExpression(nodePath) {
                  const node = nodePath.node;
                  if (node.callee.name && node.callee.name !== "commit") {
                    currentItem().call.push(node.callee.name);
                  }
                },
              },
              {}
            );
          },
        },
        {}
      );
    },
  });

  return arr;
}

module.exports = {
  getStoreConfig,
};
