const hash = require("redhq-hash");
const fs = require('fs');
const path = require("path");







async function rHash(salt="ywhibefg"){
    return hash.hash256(Math.random().toString() + Math.random().toString() + Date.now().toString() + salt)
}








const sqlite3 = require('sqlite3').verbose();


class database {

    constructor(path){

        this._db = new sqlite3.Database(path);


        this._pathx = path

        // catches ctrl+c event

        //process.on('SIGINT', this._unload);

    }


    _repeater(amount, seperator=", ", repeaterchar='?'){

        var outtab = []

        for (var i = 0; i < amount; i++){

            outtab.push(repeaterchar)

        }

        return outtab.join(seperator)

    }


    async _load(){

        return new Promise((r)=>{

            this._db.serialize(() => {

                console.log("[myRedDB] => Database loaded - " + this._pathx)

                r()

            })

        })

    }

    _unload(dontclose){

        if (this._db){

            this._db.close(()=>{

                if (dontclose != undefined){

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

    async update_multiplewhere(table, key, value, wherekeytable, wherevaluetable, extra=''){
        var wheretable = []

        for (var i = 0; i < wherekeytable.length; i++){

            wheretable.push(`${wherekeytable[i]} = ?`)

        }

        return new Promise(async (r)=>{

            const sqlquery = `UPDATE ${table} SET ${key} = ? WHERE ${wheretable.join(" AND ")}` + extra

            this._db.run(sqlquery, [value, ...wherevaluetable], (e)=>{r({succes:e === null, errormsg: e})})

        })

    }

    async delete(table, wherekey, wherevalue, extra=''){

        return new Promise(async (r)=>{

            const sqlquery = `DELETE FROM ${table} WHERE ${wherekey} = ?` + extra

            this._db.run(sqlquery, [wherevalue], (e)=>{r({succes:e === null, errormsg: e})})

        })

    }

    async delete_multiplewhere(table, wherekeytable, wherevaluetable, extra=''){
        var wheretable = []

        for (var i = 0; i < wherekeytable.length; i++){

            wheretable.push(`${wherekeytable[i]} = ?`)

        }


        return new Promise(async (r)=>{

            const sqlquery = `DELETE FROM ${table} WHERE ${wheretable.join(" AND ")}` + extra

            this._db.all(sqlquery, wherevaluetable, (e,rows)=>{r({succes:e === null, data: rows, errormsg: e})})

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

    async createTable(tablename, keys){

        return new Promise(async (r)=>{

            const sqlquery = `CREATE TABLE ${tablename} (${keys.join(", ")})`

            this._db.run(sqlquery, (e)=>{r({succes:e === null, errormsg: e})})

        })

    }

    async addColumn(table,columnName,dataType){

        //console.log("adding " + columnName)

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

    async createTablesIfMissing(tables, tablefields){
        const result_1 = await this.getTables()


        const required_tables = tables
        const table_params = tablefields

        if (!result_1.succes){
            return console.error("DB autotable fail!")
        }

        const existing_tables = []

        for (var i = 0; i < result_1.data.length; i++){
            existing_tables.push(result_1.data[i].name)
        }

        for (var i = 0; i < required_tables.length; i++){
            const exists = existing_tables.indexOf(required_tables[i]) != -1

            if (!exists){
                await this.createTable(required_tables[i], table_params[i])
            }
        }
    }


}



class userStorage {
    constructor(db="users.sql"){
        this._db = new database(path.normalize(__dirname + "/databases/" + db))
    }

    async _init(){

        const required_tables = ["users", "auth"]
        const table_params = [["displayname", "name", "id", "email", "password", "last_seen"], ["token", "expires_on"]]

        await this._db.createTablesIfMissing(required_tables, table_params)
    }


    async new_user(options){ // options = {"displayname", "name", "id", "email", "password", check_collisions}
        var name = options.name || "user"
        const displayname = options.displayname || "user"
        const password = options.password || "userpassword"
        var email = options.email || "none"
        var id = options.id || rHash()

        var collisions = false
        var email_collision = false

        if (options.check_collisions){
            const name_collision = await this._db.getall_specific("users", ["name"], "name", name).data.length != 0
            const id_collision = await this._db.getall_specific("users", ["id"], "id", id).data.length != 0
            const email_collision = await this._db.getall_specific("users", ["email"], "email", email).data.length != 0

            if(name_collision || id_collision || email_collision){
                collisions = true
            }

            if (email_collision){
                email_collision = true
            }

            if (name_collision){
                name = "user_" + rHash(name)
            }

            if (id_collision){
                id = rHash(id)
            }
        }

        return {
            success:true,
            collisions,
            email_collision,
            user:{

                //read only
                name,
                displayname,
                id,
                email,
                // dont use
                save_data: [displayname, name, id, email, password, Date.now().toString()]
            }
        }
    }


    async user_exists(user_id){
        return await this._db.getall_specific("users", ["id"], "id", user_id).data.length != 0
    }


    async save_user(user){
        if (!user.save_data){
            console.warn("Malformed user!")
            return {success:false}
        }

        if (user_exists(user.id)){
            //await this._db.delete_multiplewhere("users", ["name", "id"], [user.name, user.id])

            await this._db.update_multiplewhere("users", "key", "value", ["name", "id"], [user.name, user.id])

        } else {



        }
    }
}



module.exports = {
    database_core:database

}
