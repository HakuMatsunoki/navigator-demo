module.exports = (folderTree, search) => {
	const result = {};

    const findItems = function(folderTree, search) {
        for(const item in folderTree) {
        	const file = folderTree[item];

            if (file.isDir) findItems(file.items, search);

            if (file.name.toLowerCase().includes(search)) result[file.name] = file;
        }
    }

    findItems(folderTree, search);

    return result;
}