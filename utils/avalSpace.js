const folderReader = require('./folderReader');
const bytesToSize = require('./bytesToSize');


module.exports = function(folderTree) {
	const folderSize = folderReader.getFolderSize(folderTree);
    const maxFolderSize = process.env.DIR_MAX_SIZE;
    const availableSpace = `Available ${bytesToSize(maxFolderSize - folderSize)} of ${bytesToSize(maxFolderSize)}`;
    const availablePercentage = `${Math.round(folderSize / (maxFolderSize / 100))}%`;

    return {
    	availableSpace,
        availablePercentage,
    }
};