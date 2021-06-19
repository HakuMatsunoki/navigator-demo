import '@babel/polyfill';
import axios from 'axios';


const MAIN = document.querySelector('.js-main');
const TABLE = document.querySelector('.js-table');
const DETAILS = document.querySelector('.js-details');
const LOGIN_FORM = document.querySelector('.js-login');
const SIGNUP_FORM = document.querySelector('.js-signup');
const NAVBAR = document.querySelector('.js-navbar');
const POPUP = document.querySelector('.js-popup');
const SEARCH = document.querySelector('.js-search-input');


const setTempStorage = function(path) {
    localStorage.setItem('filerTempStorage', path || '');
};

setTempStorage(null);

const getTempStorage = function() {
    return localStorage.getItem('filerTempStorage');
};

const fileDetails = function(file) {
    DETAILS.innerHTML = '';
    const filetype = file.type.toLowerCase();
    const icon = filetype.includes('pdf') ? 'pdf.svg' :
        filetype.includes('audio') ? 'audio.svg' :
        filetype.includes('document') ? 'doc.svg' :
        filetype.includes('text') ? 'text.svg' :
        filetype.includes('-image') ? 'cdimg.svg' :
        // filetype.includes('image') ? 'image.svg' :
        filetype.includes('video') ? 'video.svg' :
        filetype.includes('msdos') ? 'exec.svg' :
        filetype.includes('application') ? 'pkg.svg' :
        filetype === 'folder' ? 'folder.svg' :
        'unknown.svg';

    const btnDnld = file.type !== 'folder' ? `
        <button class="details__btn js-dnldFile" data-link="${file.name}">Download file..</button>
    ` : '';

    const isImage = file.type.toLowerCase().includes('image/');
    const img = isImage ? '' : `<img class="details__image" src="/icons/${icon}" alt="preview" />`;

    const template = `
        <div class="details__preview">
            ${img}
        </div>

        <table class="details__info">
            <tr>
                <th class="details__info__title">Name: </th>
                <td class="details__info__value">${file.name}</td>
            </tr>
            <tr>
                <th class="details__info__title">Type: </th>
                <td class="details__info__value">${file.type}</td>
            </tr>
            <tr>
                <th class="details__info__title">Size: </th>
                <td class="details__info__value">${file.formattedSize}</td>
            </tr>
            <tr>
                <th class="details__info__title">Date: </th>
                <td class="details__info__value">${file.birthtime}</td>
            </tr>
        </table>
        ${btnDnld}
    `;

    DETAILS.insertAdjacentHTML('beforeend', template);
    if (isImage) getImagePreview(file);
};

const login = async function(email, passwd) {
    try {
        const res = await axios({
            method: 'POST',
            url: '/users/login',
            data: {
                email,
                passwd,
            },
        });

        if (res.data.status === 'success') {
            window.setTimeout(() => {
                location.assign('/files');
            }, 1000);
        }
    } catch (err) {
        console.log(err.response.data);
        alert('Oops, something went wrong..');
    }
};

const logout = async function() {
    try {
        const res = await axios({
            method: 'GET',
            url: '/users/logout',
        });
        console.log(res.data);
        if (res.data.status === 'success') {
            window.setTimeout(() => {
                location.assign('/');
            }, 1000);
        }
    } catch (err) {
        console.log(err.response.data);
        alert('Oops, something went wrong..');
    }
}

const signup = async function(name, email, passwd, passwdConfirm) {
    try {
        const res = await axios({
            method: 'POST',
            url: '/users/signup',
            data: {
                name,
                email,
                passwd,
                passwdConfirm,
            },
        });

        if (res.data.status === 'success') {
            window.setTimeout(() => {
                location.assign('/files');
            }, 1000);
        }
    } catch (err) {
        console.log(err.response.data);
        alert('Oops, something went wrong..');
    }
};

const popupToggle = function(key = 0) {
    // key = 0 - close popup
    // key = 1 - open add folder
    // key = 2 - open load files


    TABLE && TABLE.classList.remove('main__table-body--dim');
    POPUP.style.display = 'none';
    POPUP.children[1].style.display = 'none';
    POPUP.children[2].style.display = 'none';


    if (key === 1) {
        TABLE && TABLE.classList.add('main__table-body--dim');
        POPUP.style.display = 'block';
        POPUP.children[1].style.display = 'block';
    }

    if (key === 2) {
        TABLE && TABLE.classList.add('main__table-body--dim');
        POPUP.style.display = 'block';
        POPUP.children[2].style.display = 'block';
    }
};

const downloadFile = async function(fileName) {
    const path = getTempStorage();
    try {
        const res = await axios({
            method: 'POST',
            url: '/getFile',
            data: {
                fileName,
                path
            },
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
    } catch (err) {
        console.log(err.response.data);
        alert('Oops, something went wrong..');
    }
};

const getImagePreview = async function(file) {
    const path = getTempStorage();
    const fileName = file.name;
    try {
        const res = await axios({
            method: 'POST',
            url: '/getImage',
            data: {
                fileName,
                path
            },
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const img = document.createElement('img');
        img.src = url;
        img.classList.add('details__image');
        img.alt = "preview";
        document.querySelector('.details__preview').appendChild(img);
    } catch (err) {
        console.log(err.response.data);
        alert('Oops, something went wrong..');
    }
};

const addDir = async function() {
    const folderName = document.querySelector('.js-input-folder').value;
    const path = getTempStorage();

    try {
        const res = await axios({
            method: 'POST',
            url: '/files/addDir',
            data: {
                folderName,
                path
            },
        });

        popupToggle();

        if (res.data.status !== 'success') throw new Error('Server error');

        location.reload(true);
    } catch (err) {
        console.log(err.response.data);
        alert('Oops, something went wrong..');
    }
};

const loadFile = async function() {
    const files = document.querySelector('.js-input-file').files;
    const formData = new FormData();

    for (const file of files) {
        formData.append('file', file);
    }

    formData.append('path', getTempStorage());

    try {
        const res = await axios.post('/files/loadFiles', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        popupToggle();

        location.reload(true);
    } catch (err) {
        console.log(err.response.data);
        alert('Oops, something went wrong..');
    }
};

const loadFolder = async function(path, parentPath = null) {
    if (parentPath === null) parentPath = path.split('/').slice(0, -1).join('/');

    setTempStorage(path);

    try {
        const res = await axios({
            method: 'POST',
            url: '/files',
            data: {
                path
            }
        });

        if (res.data.status !== 'success') throw new Error('Server error');

        renderFolder(res.data.files, parentPath, path);
    } catch (err) {
        console.log(err.response.data);
        alert('Oops, something went wrong..');
    }
};

const renderFolder = function(files, parentPath = '', path = '') {
    const toParentPath = path.length === 0 ? '' : `
        <tr class="js-back" data-attr="${parentPath}">
            <td>../</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
    `;

    let template = `    
        <tr>
            <th>Name:</th>
            <th>Type:</th>
            <th>Size:</th>
            <th>Date:</th>
        </tr>
        ${toParentPath}
    `;

    for (const key in files) {
        const file = files[key];

        template += `
            <tr class="js-item" data-name="${key}" data-attr='${JSON.stringify(file)}')>
                <td>${key}</td>
                <td>${file.type}</td>
                <td>${file.formattedSize}</td>
                <td>${new Date(file.birthtime).toLocaleString('en-EN')}</td>
            </tr>
        `;
    }

    TABLE.innerHTML = '';
    TABLE.insertAdjacentHTML('beforeend', template);
};

const searchItems = function(search) {
    const items = TABLE.childNodes;

    items.forEach(item => {
        if (!item.dataset || !item.dataset.name) return;

        const fileName = item.dataset.name;
        item.classList.remove('item--invisible');
        
        if (!fileName.toLowerCase().includes(search.toLowerCase())) item.classList.add('item--invisible');
    });
};

SEARCH && SEARCH.addEventListener('input', event => {
    const inputVal = SEARCH.value;
    searchItems(inputVal);
});

MAIN && MAIN.addEventListener('click', event => {
    const item = event.target.closest('tr');
    const button = event.target.closest('button');

    if (item && item.classList.contains('js-item')) {
        const file = JSON.parse(item.dataset.attr);
        file.name = item.dataset.name;

        fileDetails(file);
    }

    if (button && button.classList.contains('js-popup-add')) addDir();
    if (button && button.classList.contains('js-popup-upload')) loadFile();
    if (button && button.classList.contains('js-popup-close')) popupToggle();
});

MAIN && MAIN.addEventListener('dblclick', event => {
    const item = event.target.closest('tr');
    if (!item) return;

    if (item.classList.contains('js-item')) {
        const file = JSON.parse(item.dataset.attr);

        if (file.type === 'folder')
            return loadFolder(file.localPath ? `${file.localPath}/${file.name}` : file.name, file.localPath);
    }

    if (item.classList.contains('js-back')) {
        return loadFolder(item.dataset.attr);
    }
});

LOGIN_FORM && LOGIN_FORM.addEventListener('submit', event => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
});

NAVBAR && NAVBAR.addEventListener('click', event => {
    const clickLogout = event.target.classList.contains('js-logout');
    const clickAddFile = event.target.classList.contains('js-loadFile');
    const clickAddFolder = event.target.classList.contains('js-addFolder');

    if (clickLogout) logout();
    if (clickAddFile) popupToggle(2);
    if (clickAddFolder) popupToggle(1);
});

SIGNUP_FORM && SIGNUP_FORM.addEventListener('submit', event => {
    event.preventDefault();
    const email = document.getElementById('sign-email').value;
    const password = document.getElementById('sign-password').value;
    const name = document.getElementById('name').value;
    const passwordCnf = document.getElementById('passwordCnf').value;

    signup(name, email, password, passwordCnf);
});

DETAILS && DETAILS.addEventListener('click', event => {
    const btn = event.target.closest('.js-dnldFile');
    if (!btn) return;

    const file = btn.dataset.link;
    downloadFile(file);
});