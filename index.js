const hash = require("redhq-hash");
const fs = require('fs')

class disk {
    constructor(){
        this.name = "";
        this.maxcapacity = -1;
        this._path = __dirname + "/storage";
        this.id = hash.hash256(Math.random().toString() + Math.random().toString() + Date.now().toString())
    }
    async mount(path){
        if (!fs.existsSync(path)){
            return {
                succes: false
            }
        }

        const r_path = await fs.realpathSync(path)

        this._path = r_path;
        return {
            succes: true,
            path: r_path
        }
    }
    path(){
        return this._path;
    }
}







const sqlite3 = require('sqlite3').verbose();



class database {
    constructor(path){
        this._db = new sqlite3.Database(path);


        // catches ctrl+c event
        process.on('SIGINT', this._unload);
    }

    _repeater(amount, seperator=", ", repeaterchar='?'){
        var outtab = []
        for (var i = 0; i < amount; i++){
            outtab.push(repeaterchar)
        }
        return outtab.join(seperator)
    }

    async _load(){
        console.log("Loading db...")
        return new Promise((r)=>{
            this._db.serialize(() => {
                console.log("Loaded")
                r()
            })
        })
    }
    _unload(dontclose){
        if (this._db){
            this._db.close(()=>{
                if (dontclose != undefined){
                    console.log("Closes")
                    process.exit(1)
                }
            })
        }
    }

    async new(table, keys, values, extra=''){
        return new Promise(async (r)=>{
            const sqlquery = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${await this._repeater(values.length)})` + extra
            this._db.run(sqlquery, values, (e)=>{r({succes:e === null, errormsg: e})})
        })
    }

    async update(table, key, value, wherekey, wherevalue, extra=''){
        return new Promise(async (r)=>{
            const sqlquery = `UPDATE ${table} SET ${key} = ? WHERE ${wherekey} = ?` + extra
            this._db.run(sqlquery, [value, wherevalue], (e)=>{r({succes:e === null, errormsg: e})})
        })
    }
    async delete(table, wherekey, wherevalue, extra=''){
        return new Promise(async (r)=>{
            const sqlquery = `DELETE FROM ${table} WHERE ${wherekey} = ?` + extra
            this._db.run(sqlquery, [wherevalue], (e)=>{r({succes:e === null, errormsg: e})})
        })
    }
    async getall_field(table, fields, extra=''){
        return new Promise(async (r)=>{
            const sqlquery = `SELECT ${fields.join(", ")} FROM ${table}` + extra
            this._db.all(sqlquery, (e,rows)=>{r({succes:e === null, data: rows, errormsg: e})})
        })
    }
    async getall_specific(table, fields, wherekey, wherevalue, extra=''){
        return new Promise(async (r)=>{
            const sqlquery = `SELECT ${fields.join(", ")} FROM ${table} WHERE ${wherekey} = ?` + extra
            this._db.all(sqlquery, [wherevalue], (e,rows)=>{r({succes:e === null, data: rows, errormsg: e})})
        })
    }
    async getall_specific_multiplewhere(table, fields, wherekeytable, wherevaluetable, extra=''){
        var wheretable = []
        for (var i = 0; i < wherekeytable.length; i++){
            wheretable.push(`${wherekeytable[i]} = ?`)
        }

        return new Promise(async (r)=>{
            const sqlquery = `SELECT ${fields.join(", ")} FROM ${table} WHERE ${wheretable.join(" AND ")}` + extra
            this._db.all(sqlquery, wherevaluetable, (e,rows)=>{r({succes:e === null, data: rows, errormsg: e})})
        })
    }
    async getTables(){
        return new Promise(async (r)=>{
            const sqlquery = `SELECT * FROM sqlite_master WHERE type='table'`
            this._db.all(sqlquery, (e,rows)=>{r({succes:e === null, data: rows, errormsg: e})})
        })
    }
    async createTable(tablename,info="none"){
        return new Promise(async (r)=>{
            const sqlquery = `CREATE TABLE ${tablename} (${info})`
            this._db.run(sqlquery, (e)=>{r({succes:e === null, errormsg: e})})
        })
    }
    async addColumn(table,columnName,dataType){
        console.log("adding " + columnName)
        return new Promise(async (r)=>{
            const sqlquery = `ALTER TABLE ${table} ADD ${columnName} ${dataType}`
            this._db.run(sqlquery, (e)=>{r({succes:e === null, errormsg: e})})
        })
    }
    async removeColumn(table,columnName){
        return new Promise(async (r)=>{
            const sqlquery = `ALTER TABLE ${table} DROP COLUMN ${columnName}`
            this._db.run(sqlquery, (e)=>{r({succes:e === null, errormsg: e})})
        })
    }
    async getCustom(query){
        return new Promise(async (r)=>{
            this._db.all(query, (e,rows)=>{r({succes:e === null, data: rows, errormsg: e})})
        })
    }
    async _custom(sqlquery, replacerTable=[]){
        return new Promise(async (r)=>{
            this._db.all(sqlquery, replacerTable, (e,rows)=>{r({succes:e === null, data: rows, errormsg: e})})
        })
    }
    
}


module.exports = {
    disk: disk,
    database:database
}