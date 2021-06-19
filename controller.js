const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { promisify } = require('util');

const catchAsync = require('./utils/catchAsync');
const AppError = require('./utils/appError');
const folderReader = require('./utils/folderReader');
const bytesToSize = require('./utils/bytesToSize');
const avalSpace = require('./utils/avalSpace');
const searchItem = require('./utils/searchItem');
const User = require('./model');



// RENDER PAGES
exports.getOverview = (req, res, next) => {
    const userFolder = path.join(__dirname, `files/${req.user.id}`);
    const folderTree = folderReader.getFolderItems(userFolder, userFolder);
    const { availableSpace, availablePercentage } = avalSpace(folderTree);

    res.status(200).render('overview', {
        title: 'Overview',
        files: folderTree,
        availableSpace,
        availablePercentage,
    });
};

exports.getLoginPage = catchAsync(async (req, res, next) => {
    res.status(200).render('login', {
        title: 'Login'
    });
});

// AUTHORIZATION API
const signToken = function(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = function(id, res, statusCode) {
    const token = signToken(id);

    res.cookie('jwt', token, {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        // secure: true,
        httpOnly: true,
    });

    res.status(statusCode).json({
        status: 'success',
        token
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const data = req.body;
    const { name, email, passwd, passwdConfirm } = data;

    // basic validation
    if (!name || !email || !passwd || !passwdConfirm) return next(new AppError('Name, email and password required..', 401));
    if (!/(.+)@(.+){2,}\.(.+){2,}/.test(email)) return next(new AppError('Invalid email..', 401));
    if (passwd !== passwdConfirm) return next(new AppError('Invalid password confirmation', 401));


    const userData = {
        name,
        email,
        passwd
    };
    const { id } = await User.createOne(userData);
    const dir = path.join(__dirname, `files/${id}`);

    fs.mkdirSync(dir);
    createSendToken(id, res, 201);
});

exports.login = catchAsync(async (req, res, next) => {
    const data = req.body;
    const user = await User.getOne(data);

    if (!user || !await User.correctPasswd(user.passwd, data.passwd)) return next(new AppError('Wrong email or password', 401));

    createSendToken(user.id, res, 201);
});

exports.logout = catchAsync(async (req, res, next) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 1 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        status: 'success',
    });
});

exports.protectRoute = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) return next(new AppError('You are not logged in..', 401));

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return next(new AppError("User does no longer exist.", 401));
    req.user = user;

    next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
    let token;
    if (!req.cookies.jwt) return next();

    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return next();

    res.locals.user = user;

    next();
});

// ADD FOLDER API
exports.addDir = catchAsync(async (req, res, next) => {
    const currentUserDir = path.join(__dirname, `files/${req.user.id}`);
    const { folderName } = req.body;
    const currentPath = req.body.path ? req.body.path + '/' : '';

    if (!folderName) return next(new AppError('Please, enter new folder name..', 400));

    fs.mkdirSync(`${currentUserDir}/${currentPath}${folderName}`);

    res.status(200).json({
        status: 'success',
    });
});

// UPLOAD FILES API
const multerStorage = multer.diskStorage({
    destination: (req, file, cbk) => {
        cbk(null, 'files/temp');
    },
});

const upload = multer({
    storage: multerStorage
});

exports.uploadFiles = upload.array('file', 10);

exports.moveFiles = catchAsync(async (req, res, next) => {
    const userDir = path.join(__dirname, `files/${req.user.id}`);
    const folderTree = folderReader.getFolderItems(userDir, userDir);
    const folderSize = folderReader.getFolderSize(folderTree);
    const files = req.files;
    const currentPath = req.body.path ? req.body.path + '/' : '';
    const tempDir = 'files/temp';

    const fileSize = files.reduce((acc, file) => {
        return acc + file.size;
    }, 0);

    if (fileSize + folderSize > process.env.DIR_MAX_SIZE) {
        fs.readdir(tempDir, (err, files) => {
            if (err) throw err;

            for (const file of files) {
                fs.unlink(path.join(tempDir, file), err => {
                    if (err) throw err;
                });
            }
        });

        return next(new AppError('No disk space enough..', 400));
    }

    for (const file of files) {
        const currentFile = path.join(__dirname, file.path);

        const newFile = path.join(__dirname, `files/${req.user.id}/${currentPath}${file.originalname}`);

        fs.rename(currentFile, newFile, function(err) {
            if (err) throw new AppError('Oops, server error...', 500);
        });
    };

    res.status(200).json({
        status: 'success',
    });
});

// DOWNLOAD FILES API
exports.getFile = catchAsync(async (req, res, next) => {
    const { fileName } = req.body;
    if (!fileName) return next(new AppError('Please, set proper file name to download..'), 400);

    const currentPath = req.body.path ? req.body.path + '/' : '';
    const file = `./files/${req.user.id}/${currentPath}${fileName}`;

    fs.access(file, fs.constants.R_OK, err => {
        if (err) return next(new AppError('This file does not exist..'), 400);

        res.writeHead(200, {
            "Content-Disposition": `attachment; filename=${req.params.name}`
        });
        fs.createReadStream(file).pipe(res);
    });
});

exports.getImage = catchAsync(async (req, res, next) => {
    const { fileName } = req.body;
    if (!fileName) return next(new AppError('Please, set proper file name to download..'), 400);

    const currentPath = req.body.path ? req.body.path + '/' : '';
    const file = `./files/${req.user.id}/${currentPath}${fileName}`;

    res.statusCode = 200;
    res.setHeader("Content-Type", "image/jpeg");

    fs.readFile(file, (err, image) => {
        res.end(image);
    });
});

// GET FOLDER API
exports.getFolder = (req, res, next) => {
    const userFolder = path.join(__dirname, `files/${req.user.id}`);
    let folderTree = folderReader.getFolderItems(userFolder, userFolder);
    const { availableSpace, availablePercentage } = avalSpace(folderTree);

    if (req.body.path.length > 0) {
        const currentFolderPath = req.body.path.split('/');

        currentFolderPath.forEach(dir => {
            if (!folderTree[dir]) throw new AppError('Wrong path requested...', 400);
            folderTree = folderTree[dir].items;
        });
    }

    res.status(200).json({
        files: folderTree,
        status: 'success',
    });
};

// SEARCH ITEMS API (not used)
exports.search = (req, res, next) => {
    const userFolder = path.join(__dirname, `files/${req.user.id}`);
    const folderTree = folderReader.getFolderItems(userFolder, userFolder);
    const search = req.body.search;

    const files = searchItem(folderTree, search);

    res.status(200).json({
        files,
        status: 'success',
    });
};