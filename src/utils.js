const path = require("path");
const fs = require("fs");

/** 获取文件夹下所有文件路径
 * @param {string} dir  文件夹绝对路径
 * @param {string[]} includes 需要解析的文件格式 .js
 * @param {string[]} excludes 排除的文件
 */
function getFilePath(dir = "", includes = [], excludes = []) {
  let pathList = [];

  let dirPath = dir;
  if (!path.isAbsolute(dir)) {
    dirPath = path.join(path.resolve("./"), dir);
  }

  const filePaths = fs.readdirSync(dirPath);

  filePaths.map((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      const fileType = path.extname(filePath);

      // 排除文件检测
      if (excludes.filter((item) => item.test(filePath)).length !== 0) {
        return;
      }

      if (includes.length === 0 || includes.includes(fileType)) {
        pathList.push(filePath);
      }

      return;
    }

    if (stat.isDirectory()) {
      pathList = pathList.concat(getFilePath(filePath, includes, excludes));
    }
  });

  return pathList;
}

/**
 * import的路径转绝对路径
 * @param {string} filePath 当前文件路径
 * @param {string} importPath import文件路径
 * @param {object} alias 别名配置
 */
function importPathResolve(filePath, importPath, alias) {
  let dirPath = "";

  // 别名处理
  for (const key in alias) {
    if (Object.hasOwnProperty.call(alias, key)) {
      const value = alias[key];
      if (importPath.indexOf(key) === 0) {
        dirPath = path.resolve(importPath.replace(key, value));
        return dirPath;
      }
    }
  }

  dirPath = path.resolve(path.dirname(filePath), importPath);

  // 验证文件是否存在
  // fs.statSync(dirPath, { throwIfNoEntry: false });

  return dirPath;
}

module.exports = {
  getFilePath,
  importPathResolve,
};
