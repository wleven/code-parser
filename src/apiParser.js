/**
 * 获取API配置信息
 */
const babelParser = require("@babel/parser");
const babelTraverse = require("@babel/traverse").default;
const t = require("@babel/types");
const utils = require("./utils");

const fs = require("fs");
const path = require("path");

/** 解析api配置文件
 * @param {string} filePath 文件路径
 */
function getApiConfig(filePath) {
  const obj = {
    fileName: filePath,
    apiList: [],
  };
  const fileData = fs.readFileSync(filePath, "utf8");

  const ast = babelParser.parse(fileData, {
    sourceType: "module",
  });

  const lastObj = () => {
    return obj.apiList[obj.apiList.length - 1];
  };

  babelTraverse(ast, {
    /** 导出 */
    ExportNamedDeclaration(path) {
      // 获取备注
      const commonts = path.node.leadingComments;
      if (!commonts || commonts.length === 0) return;
      const commont = path.node.leadingComments[0].value;
      lastObj().commont = commont.trim();
    },

    /** 函数 */
    FunctionDeclaration(path) {
      lastObj().functionName = path.node.id.name;
    },

    /** 对象属性 */
    ObjectProperty(path) {
      const key = path.node.key.name;
      const valueNode = path.node.value;

      if (key === "url") {
        lastObj().url = valueNode.value;
        return;
      }

      if (key === "method") {
        // 判断method是否是三元表达式
        if (t.isConditionalExpression(valueNode)) {
          lastObj().method = [
            valueNode.consequent.value?.toUpperCase(),
            valueNode.alternate.value?.toUpperCase(),
          ];
          return;
        }
        lastObj().method = valueNode.value?.toUpperCase();
      }
    },

    /** 进入节点 */
    enter(path) {
      if (path.node.type === "ExportNamedDeclaration") {
        obj.apiList.push({});
      }
    },

    /** 退出节点 */
    exit() {},
  });

  return obj;
}

/** config对象转map */
function formatMap(data = []) {
  const m = new Map([]);

  data.map((item) => {
    if (!Array.isArray(item.apiList) || item.apiList.length === 0) return;

    const apiMap = new Map([]);

    item.apiList.map((api) => {
      apiMap.set(api.functionName, api);
    });

    m.set(item.fileName, m);
  });

  return m;
}

module.exports = {
  getApiConfig,
  formatMap,
};
