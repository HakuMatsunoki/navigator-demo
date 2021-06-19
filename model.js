const mysql = require('mysql2/promise');
const AppError = require('./utils/appError');
const bcrypt = require('bcryptjs');

class User {
    dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_NAME,
        password: process.env.DB_PASSWD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 2,
        queueLimit: 0,
        debug: false
    };
    pool = mysql.createPool(this.dbConfig);

    async _query(sql, params) {
        const [rows, fields] = await this.pool.execute(sql);

        return rows;
    };

    async createOne(userData) {
        const { name, email, passwd } = userData;
        const formattedEmail = email.toLowerCase();
        const anyUserWithEmail = await this._query(`SELECT id FROM FilerUsers WHERE email = '${formattedEmail}'`); //*

        if (anyUserWithEmail.length > 0) throw new AppError('User with this email already exists', 409);

        const passwdEncrypted = await bcrypt.hash(passwd, 12);
        await this._query(
            `INSERT INTO FilerUsers (name, email, passwd) VALUES ('${name}', '${formattedEmail}', '${passwdEncrypted}')`
        );

        const user = await this._query(
            `SELECT id FROM FilerUsers WHERE email = '${formattedEmail}'`
        );

        return user[0];
    };

    async correctPasswd(passwd, candidate) {
    	return await bcrypt.compare(candidate, passwd);
    };

    async getOne(userData) {
        const { email, passwd } = userData;
        const formattedEmail = email.toLowerCase();
        const user = await this._query(`SELECT id, name, email, passwd FROM FilerUsers WHERE email = '${formattedEmail}'`); //*

        return user[0];
    };

    async findById(id) {
    	const user = await this._query(`SELECT id, name, email, passwd FROM FilerUsers WHERE id = '${id}'`); //*
    	
    	return user[0];
    };
};

module.exports = new User();