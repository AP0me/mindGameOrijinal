class player{
    db = require('./db');
    crypto = require('crypto');
    #first_name;
    #player_name;
    #email;
    #password_hash;
    #avatar;

    constructor(email, first_name, player_name, password, avatar){
        this.email_in_use(email).then(result => {
            var email_used = result;

            if (first_name == undefined){
                try{
                    if(!(email_used)) throw "No account with this mail";

                    this.get_from_db(email).then(result => {
                        console.log(result);
                    }).catch(err => {
                        console.log(err.message);
                    })
        
                }catch(err){
                    console.log(err);
                }
            }else{
                // signup
                try{
                    if(email_used) throw "Already have an account with this email";

                    this.#first_name=first_name;
                    this.#player_name=player_name;
                    this.#email=email;
                    this.#password_hash=this.hash_pass(password);
                    this.#avatar = avatar;

                    var insert_sql = 'INSERT INTO player_account(first_name, player_name, player_icon, email, login_password_hash, created_at) VALUES (?,?,?,?,?,?)';
                    var values = [this.#first_name, this.#player_name, parseInt(this.#avatar), this.#email, this.#password_hash, new Date()];
                    this.db.query(insert_sql, values, function(err,result){
                        if(err) throw err;
                    });

                }catch(err){
                    console.log(err);
                }
            }
        }).catch(err => {
            console.log(err.message);
        })
    }

    // getters and setters
    change_first_name(new_first_name){
        this.#first_name=new_first_name;
        update_db("first_name", this.#first_name);
    }
    get_first_name(){
        return this.#first_name;
    }

    change_player_name(new_player_name){
        this.#player_name=new_player_name;
        update_db("player_name", this.#first_name);
    }
    get_player_name(){
        return this.#player_name;
    }

    change_avatar(new_avatar){
        this.#avatar=new_avatar;
        update_db("player_icon", this.#avatar);
    }
    get_avatar_url(){
        let sql = `SELECT icon_URL FROM player_icons pi JOIN player_account pa ON pi.id = pa.player_icon WHERE email = "${this.#email}"`
        this.db.query(sql, (err, result)=>{
            if(err) throw err;
            return result[0]['icon_URL'];
        })
    }

    // user cannot see their password or change their email
    get_email(){
        return this.#email;
    }
    // get_password(){
    //     return this.#password_hash;
    // }
    change_password(new_password){
        this.#password_hash=this.hash_pass(new_password);
        update_db("login_password_hash", this.#password_hash);
    }
    get_weekly_score(){
        let sql = `SELECT total_weekly_score FROM player_account WHERE email = ${this.#email}`;
        this.db.query(sql, (err, result)=>{
            if (err) throw err;
            return result[0]['total_weekly_score'];
        });
    }

    // hash password function
    hash_pass(password){
        return this.crypto.createHash('sha256').update(password).digest('base64');
    }
    

    // checks whether the given password matches the inputted password
    check_password(password){
        let pass = this.hash_pass(password);
        if(this.#password_hash == pass){
            return true;
        }else{
            return false;
        }
    }


    // checks whether the email exist in database or not
    email_in_use = email => {
        return new Promise((resolve, reject) =>{
            let sql = `SELECT COUNT(*) as count FROM player_account WHERE email = "${email}"`
            this.db.query(sql, (err, result)=>{
                if(err) reject(err);

                if(parseInt(result[0]['count']) > 0){
                    resolve(true);
                }else{
                    resolve(false);
                }
            })
        })
    }

    // get data from db
    get_from_db = email => {
        return new Promise((resolve, reject) =>{
            let sql = `SELECT * FROM player_account WHERE email = "${email}"`;
            this.db.query(sql, (err, result)=>{
                if(err) reject(err);

                this.#first_name=result[0]['first_name'];
                this.#player_name=result[0]['player_name'];
                this.#email=result[0]['email'];
                // this.#password_hash=result[0]['login_password_hash'];
                this.#avatar = result[0]['player_icon'];

                resolve(true);
            })
        })
    }

    // inserting to db
    update_db(column, value){
        let sql = `UPDATE players SET ${column} = "${value}" WHERE email = ${this.#email}`;
        this.db.query(sql, (err, result)=>{
            if (err) throw err;
        });
    }

    // adding score
    add_score(reached_level){
        let sql = `UPDATE players SET total_weekly_score = total_weekly_score + ${reached_level} WHERE email = ${this.#email}`;
        this.db.query(sql, (err, result)=>{
            if (err) throw err;
        });
    }
}
module.exports = player;