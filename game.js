class game{
    path = require('path');
    player = require(path.join(__dirname, '..', 'user/player.js'));
    db = require(path.join(__dirname, '..', 'user/db.js'));

    #game_room_id;

    #player1;
    #player2;
    #player3;
    #player4;

    #numOfPlayers;
    #numOfLives;
    #numOfThrowingStar;
    #levelNum;

    constructor(game_room_id, numOfPlayers, player1, player2, player3, player4){
        this.#game_room_id = game_room_id;
        this.#numOfPlayers = numOfPlayers;
        this.#player1 = player1;
        this.#player2 = player2;

        if(numOfPlayers = 3){
            this.#player3 = player3;
        }
        if(numOfPlayers = 4){
            this.#player3 = player3;
            this.#player4 = player4;
        }
    }

    // getting player's player_name and avatar URL
    get_data_on_player(player_){
        var data = {
            player_name : player_.get_first_name(),
            avatar_URL: player_.get_avatar_url()
        }
        return data;
    }

    // next level, increases the number of lives and throwing star if necessary and returns the card's url
    next_level(){
        this.#levelNum+=1;
        let sql = `SELECT live_count_add, star_count_add, card_url
            FROM game_levels gl
            JOIN game_cards gc
                ON gl.card=gc.id 
            WHERE level_num = ${this.#levelNum}`;

        this.db.query(sql, (err, result) => {
            if(err) throw err;

            this.#numOfLives+=result[0]['live_count_add'];
            this.#numOfThrowingStar+=result[0]['star_count_add'];
            return result[0]['card_url']; 
        })
    }

    raise_paw(player){
        let sql=`UPDATE game_room_players grp JOIN game_room gr ON grp.game_room_id = gr.id
            SET raise_paw = true 
            WHERE player_id = ${player.get_player_id()} and grp.game_room_id = ${this.#game_room_id}`;
        this.db.query(sql, (err, result)=>{
            if(err) throw err;
        })
    }

    get_cards(player){
        let sql = `SELECT card_num
            FROM game_room_players grp 
            JOIN game_room_player_cards grpc
                ON grpc.game_room_player_id = grp.id
            JOIN game_room gr
                ON gr.id = grp.game_room_id
            WHERE player_id = ${player.get_player_id()} and game_room_id = ${this.#game_room_id} and played = false`;
        this.db.query(sql, (err, result)=>{
            if(err) throw err;
            var cards;
            for(let i = 0; i < result.lengthl; i++){
                cards += result[i]['card_num'];
            }
            return cards;
        })
    }

    play_card(player, card){
        let sql = `UPDATE game_room_players grp 
            JOIN game_room_player_cards grpc
                ON grpc.game_room_player_id = grp.id
            JOIN game_room gr
                ON gr.id = grp.game_room_id
            SET played = true
            WHERE player_id = 1 and game_room_id = 1 and played = false`; 
        this.db.query(sql, (err, result)=>{
            if(err) throw err;
        })
    }

    use_throwing_star(){
        let sql = ``
    }

}

module.exports = game;