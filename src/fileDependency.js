const { getFilePath } = require("./utils");

/**
 * 文件依赖关系分析
 * @param {string} dir  文件夹绝对路径
 * @param {string[]} includes 需要解析的文件格式 .js
 * @param {string[]} excludes 排除的文件
 */
function getFileDependency(dir, includes, excludes) {
  const list = getFilePath(dir, includes, excludes);
  console.log(list);
}

module.exports = {
  getFileDependency,
};
