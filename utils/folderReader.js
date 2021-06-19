const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const bytesToSize = require('./bytesToSize');


const getFolderItems = function(fullPath, startPath) {
    const res = {};
    const dirItems = fs.readdirSync(fullPath);
    const localPath = fullPath.replace(startPath, '').slice(1);

    dirItems.forEach(item => {
        const stats = fs.statSync(path.join(fullPath, item));
        const formattedSize = `${bytesToSize(stats.size)} (${stats.size} bytes)`;

        if (stats.isFile()) {
            const type = mime.lookup(item);

            res[item] = {
                name: item,
                localPath,
                type: type ? type : 'unknown',
                size: stats.size,
                formattedSize,
                birthtime: stats.birthtime,
                isDir: stats.isDirectory(),
            };
        } else {
            res[item] = {
                name: item,
                localPath,
                type: 'folder',
                size: stats.size,
                formattedSize,
                birthtime: stats.birthtime,
                isDir: stats.isDirectory(),
                items: getFolderItems(path.join(fullPath, item), startPath),
            };
        }
    });

    return res;
};
exports.getFolderItems = getFolderItems;

const getFolderSize = function(dirTree) {
    const dirItems = Object.keys(dirTree);
    let size = 0;

    dirItems.forEach(item => {
        const itemObj = dirTree[item];
        size += !itemObj.isDir ? itemObj.size : getFolderSize(itemObj.items);
        itemObj.isDir && (itemObj.size = size);
    });

    return size;
};
exports.getFolderSize = getFolderSize;