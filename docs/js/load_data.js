// 定数
import {app, db, fb_auth, fb_fs, fb, auth} from "./init_firebase.js";

const root_path = {live:"https://m.tianyi9.com/#/getlive?live_id=", upload:"https://m.tianyi9.com/upload/", user:"https://m.tianyi9.com/#/userInfo?uid=", user_info:"https://m.tianyi9.com/API/user_info?uid="};
const lamp_colors = {"NO PLAY": "#dddddde6", "CLEAR": "#ccffcce6", "FULL COMBO": "#ffffcce6"}; // クリアランプの色
const dani_rank = ["初段", "二段", "三段", "四段", "五段", "六段", "七段", "八段", "九段", "十段", "中伝", "皆伝"];
const dani_rank_en = {"初段":"shodan", "二段":"nidan", "三段":"sandan", "四段":"yondan", "五段":"godan", "六段":"rokudan", "七段":"nanadan", "八段":"hachidan", "九段":"kyudan", "十段":"judan", "中伝":"chuden", "皆伝":"kaiden"};
let header_info; // header.json の情報
let chart_info; // ALL
let insane_chart_info; // 発狂難易度表入り譜面
let skill_point_table; // skillpoint 計算用テーブル
let skill_point_target_num = 30;
let dani_info, course_info;
let max_score = 1000000;
let min_score = 0;
const dani_lamp_imgs = {"NO PLAY":'./imgs/dani/no_play.png', "FAILED":'./imgs/dani/failed.png', "CLEAR":'./imgs/dani/clear.png', "EX CLEAR":'./imgs/dani/ex_clear.png'}
const initial_regex_pt = {"A.B.C.D" : /^[A-Da-d]/, "E.F.G.H" :  /^[E-He-h]/, "I.J.K.L" : /^[I-Li-l]/, "M.N.O.P" :  /^[M-Pm-p]/, "Q.R.S.T" : /^[Q-Tq-t]/, "U.V.W.X.Y.Z" : /^[U-Zu-z]/, "OTHERS" : /^([^A-Za-z])/};
const initial_regax = ["A.B.C.D", "E.F.G.H", "I.J.K.L", "M.N.O.P", "Q.R.S.T", "U.V.W.X.Y.Z", "OTHERS"];
const num_recommend = 10;
//サーバー側
//ローカル時間はgetJST(), サーバー時間は data.toDate()で比較する


// localStorage セーブデータ
//1. key : live_id, value : {"score": 990125, "lamp": "NO PLAY" or "CLEAR" or "FULL COMBO", "fav": true or false}
//2. key : "user_info", value : {"user_name": "user_name", "uid": "rtyureutreuteru"} 非ログイン時 {"user_name": "guest", "uid": null}
//3. key : "dani" + season_num, value : {"1":{"score":[1,2,3,4], rate:95, status:"CLEAR" or "EX_CLEAR" or "FAILED"}, ... , "12":{"score":[1,2,3,4], rate:95, status:"CLEAR" or "EX_CLEAR" or "FAILED"}}
//4. key : "skill_point", value : {"point": 334, "targets": {"live_id": 34, ... , "live_id": 25}}
//5. key : "dani_season_0", value : {"初段":{"each_score:[1,2,3,4]", "total_score":10, "lamp": "NO PLAY" or "CLEAR" or "EX CLEAR" or "FAILED"}, "二段":{} ...}
//6. key : "course", value : {"course_key":{"each_score:[1,2,3,4]", "total_score":10, "lamp": "NO PLAY" or "CLEAR" or "EX CLEAR" or "FAILED"}, ...}

async function setUserInfo(is_login){
    const key = "user_info";
    if(localStorage.getItem(key) === null) {
        let new_obj = {
            "user_name": "guest",
            "uid": null,
        };
        localStorage.setItem(key, JSON.stringify(new_obj));
    }
    if(is_login){
        const uid = auth.currentUser.uid;
        let user_info_ref = fb_fs.doc(fb_fs.collection(db, "users"), uid);
        const userSnap = await fb_fs.getDoc(user_info_ref);
        if(userSnap.exists()){
            console.log("success : get user_info");
            localStorage.setItem(key, JSON.stringify({"user_name":userSnap.data()["user_name"], "uid":uid}));
        }
    }else{
        localStorage.setItem(key, JSON.stringify({"user_name":"guest", "uid":null}));
    }
}
function getUserInfo(){
    const key = "user_info";
    if(localStorage.getItem(key) === null) {
        setUserInfo(auth.currentUser);
    }
    return JSON.parse(localStorage.getItem(key));
}

// ログイン時にのみ
async function updateUserName(new_name){
    const key = "user_info";
    const uid = auth.currentUser.uid;

    let user_info_ref = fb_fs.doc(fb_fs.collection(db, "users"), uid);
    await fb_fs.updateDoc(user_info_ref, {"uid":uid, "user_name": new_name})
        .then(()=>{
            alert("success : update user_info");
            console.log("success : update user_info");
            localStorage.setItem(key, JSON.stringify({"user_name": new_name, "uid":uid}));
        })
        .catch( (error)=>{
            alert(`failed : update user_info (${error})`);
            console.log(`failed : update user_info (${error})`);
        });
}

function getMusic_LocalData(key){
    if(localStorage.getItem(key) === null) {
        let new_obj = {
            "score": 0,
            "lamp": "NO PLAY",
            "fav": false
        };

        localStorage.setItem(key, JSON.stringify(new_obj));

    }
    // console.log(JSON.parse(localStorage.getItem("Esb0t2wNQDruAE2t")))
    return JSON.parse(localStorage.getItem(key));
}

function changeBgColor(tr_obj, new_color){
    tr_obj.css('background-color', new_color);
}
function changeScoreText(tr_obj, lamp, new_score){
    if(lamp === 'NO PLAY'){
        tr_obj.find('#td_score').text('NO PLAY');
    }else{
        tr_obj.find('#td_score').text(new_score);
    }
}

function calAveScore(lv){
    // NO PLAY は除く
    let m = insane_chart_info.filter(c =>(c["★"] == lv) && (getMusic_LocalData(c["live_id"])["lamp"] !== "NO PLAY"));
    if(!m.length){
        return 0;
    }
    let sum = 0;
    for(let i=0; i<m.length; i++){
        sum += parseInt(getMusic_LocalData(m[i]["live_id"])["score"]);
    }
    return sum / m.length;
}
//全体のランプ状況
function setLampStatus(){
    let num_no_play = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "NO PLAY").length;
    let num_clear = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "CLEAR").length;
    let num_full_combo = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "FULL COMBO").length;
    let num_total = num_clear + num_full_combo + num_no_play;

    $("#lampStatus_NO_PLAY").text(num_no_play); //NO PLAY の数;
    $("#lampStatus_CLEAR").text(num_clear); //CLEAR の数;
    $("#lampStatus_FULL_COMBO").text(num_full_combo); //FULL COMBO の数;
    $("#totalCntArea").text("Total " + num_total + " Charts");
    return {"NO PLAY": num_no_play, "CLEAR": num_clear, "FULL COMBO": num_full_combo, "TOTAL": num_total}
}

function initializeSkillPointTable(tar_num=skill_point_target_num){
    let m = insane_chart_info;
    if(!m.length){return {}};
    skill_point_table = [];
    for(let i=0; i<m.length; i++){
        skill_point_table.push( {"live_id": m[i]["live_id"], "live_name": m[i]["live_name"], "★": m[i]["★"], "lamp": getMusic_LocalData(m[i]["live_id"])["lamp"], "skill_point": calSkillPoint(m[i])} );
    }
    skill_point_table.sort((a, b) => {
        a = a["skill_point"];
        b = b["skill_point"];
        if(a < b) return 1;
        else if(a > b) return -1;
        return 0;
    });
    // console.log(skill_point_table)

    // 難易度表から削除されることもあり得るので毎回リセット&セット
    const key = "skill_point";
    let new_obj = {"point": 0.0, "targets": {}};
    new_obj.targets = skill_point_table.filter(function (item){return item.lamp !== "NO PLAY"}).slice(0, tar_num);
    new_obj.point = Object.keys(new_obj.targets).reduce((sum, key) => sum + (new_obj.targets[key].skill_point || 0) , 0);
    localStorage.setItem(key, JSON.stringify(new_obj));
}

function getSkillPoint(){
    const key = "skill_point";
    return JSON.parse(localStorage.getItem(key));
}
function calSkillPoint(m_data){
    let lamp = getMusic_LocalData(m_data["live_id"])["lamp"]
    let full_combo_bias = (lamp === "FULL COMBO") ? 1.2 : 1.0;
    return parseFloat((2*full_combo_bias * 100 * getMusic_LocalData(m_data["live_id"])["score"]*Math.cbrt(parseInt(m_data["★"]))/max_score).toFixed(1));
}
function updateSkillPoint(id, new_rec, tar_num=skill_point_target_num){
    let index = skill_point_table.findIndex(({live_id}) => live_id === id);
    skill_point_table[index]["lamp"] = getMusic_LocalData(new_rec["live_id"])["lamp"];
    skill_point_table[index]["skill_point"] = calSkillPoint(new_rec);
    let now_point = getSkillPoint();
    skill_point_table.sort((a, b) => {
        a = a["skill_point"];
        b = b["skill_point"];
        if(a < b) return 1;
        else if(a > b) return -1;
        return 0;
    });
    let new_obj = {"point": 0.0, "targets": {}};
    new_obj.targets = skill_point_table.filter(function (item){return item.lamp !== "NO PLAY"}).slice(0, tar_num);
    new_obj.point = parseFloat((Object.keys(new_obj.targets).reduce((sum, key) => sum + (new_obj.targets[key].skill_point || 0) , 0)).toFixed(1));
    localStorage.setItem("skill_point", JSON.stringify(new_obj));
}

//個々の★のランプ状況 テキスト
function getLevelLampStatus(lv) {
    let num_no_play = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "NO PLAY" && c["★"] == lv).length;
    let num_clear = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "CLEAR" && c["★"] == lv).length;
    let num_full_combo = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "FULL COMBO" && c["★"] == lv).length;
    let num_total = num_clear + num_full_combo + num_no_play;
    return "All: " + num_total + "  " + " NP: " + num_no_play + "  " + " C: " + num_clear + "  "  + " FC: " + num_full_combo;
}

function getDaniScore(){
    const key = "dani_season_" + header_info["season"];
    if(localStorage.getItem(key) === null) {
        let new_dic = {};
        for(let i=0; i<dani_rank.length; i++){
            let new_obj = {
                "each_score": [0,0,0,0],
                "total_score": 0,
                "lamp": "NO PLAY"
            };
            new_dic[dani_rank[i]] = new_obj;
        }
        localStorage.setItem(key, JSON.stringify(new_dic));
    }
    return JSON.parse(localStorage.getItem(key));
}
// __________________________________________________________________________________________
// ******************************************************************************************
// 最初に実行する
// ******************************************************************************************
// __________________________________________________________________________________________
// firebase ログイン確認 => ログインしていたら
// header.json 読み込み => Googleスプレッドシートへのアクセス

$(document).ready(function () {
    //firebase ログイン確認
    fb_auth.onAuthStateChanged(auth, (user) => {
        if (user) {
            // サインイン済みの時
            const uid = user.uid;
            console.log("login_status : login");

        } else {
            // サインインしてない時
            console.log("login_status : logout");
        }
        setUserInfo(user);
        setLoginStatusToObj();
    });

    $.getJSON($("meta[name=chart_data]").attr("content"), function (header) {
        $.getJSON(header.data_url, function (chart) {
            header_info = header;
            chart_info = chart;
            insane_chart_info = chart_info.filter(c => c["★"] !== ""); // 発狂難易度表入り譜面のみをフィルタで取得
            initializeSkillPointTable();
            makeTable(insane_chart_info, header_info["symbol"]);
        });
    });
    $.getJSON($("meta[name=dani_data]").attr("content"), function (dani) {
        dani_info = dani;
    });
    $.getJSON($("meta[name=course_data]").attr("content"), function (course) {
        course_info = course;
    });
    checkLocalStorageSize();
    daniImgsPreload();
});


// スクロールすると丈夫に固定されるナビゲーション
$(document).ready(function () {
    let navBar = $("#navBar");
    $(window).scroll(function (){
        if($(this).scrollTop() >= $("#panel").offset().top){
            navBar.addClass('fixedBar');
        }else{
            navBar.removeClass('fixedBar');
        }
    });
});
// 上部のパネルを生成
function makePanel(headerInfo){
    let obj = $("#panel");
    obj.html(""); // 初期化
    //ランセレ部分
    obj.load("./tmp/panel.html", function (){
        let lv_length = header_info["level_order"].length;
        for(let i = 0; i < lv_length; ++i){
            let lv = header_info["level_order"][i];
            $('<option value=' + lv + '>★' + lv + '</option>').appendTo($("#randomLevel"));
        }
        setLampStatus();
    });

    obj.css("visibility", "visible");
}

// 発狂難易度のテーブルを生成
function makeTable(){
    let obj = $("#app");
    obj.html(""); // 初期化
    obj.load("./tmp/musicTable.html", function (){
        //default folder
        makeDefaultFolder();
        //custom folder
        makeCustomFolder();
        //panel
        makePanel(header_info);
    });
};

function makeDefaultFolder(){
    console.log(getSkillPoint())
    // header.json に書かれている level_order から順番に生成
    let symbol = header_info["symbol"];
    for(let i = 0; i < header_info["level_order"].length; ++i){
        let lv = header_info["level_order"][i];
        let music = insane_chart_info.filter(c => c["★"] == lv);
        // 該当する譜面が存在すればアコーディオンリスト 1 つ生成
        if(music.length){
            // アコーディオン部
            $("#default_folder").append("<div class='ac2_one'" + "id=lv" + lv + "><div class='ac2_header'><div class='items_header'><div class='symbol_header'>" + symbol + lv + "</div>" +
                "<div class='lamp_cnt_header'>" + "Total: 00 NP: 00 C: 00 FC: 00" + "</div>" +
                "</div></div><div class='ac_inner'>");
            $("#lv" + lv).find(".ac_inner").append("<table class='box_one' id='table_int'></table>");
            // 表のヘッダ追加 ["(symbol)", "(lamp)", "(jacket)", Title, Artist, Author, Level, Score]
            $("#lv" + lv).find(".ac_inner .box_one").append("<thead class='table-dark'><tr><th id='th_symbol'>"+ symbol +"</th><th id='th_lamp'></th><th id='th_jacket'></th><th id='th_title' data-sort='None'>Title</th><th id='th_artist' data-sort='None'>Artist</th><th id='th_author' data-sort='None'>Author</th><th id='th_level' data-sort='None'>Level</th><th id='th_score' data-sort='None'>Score</th></tr></thead><tbody>");
            // 行追加
            for(let j = 0; j < music.length; ++j){
                //localStorage["live_id"] からクリア状況データを取得
                let music_localData = getMusic_LocalData(music[j]["live_id"]);
                // music[j]["live_id"] から row を特定できるようにする
                let row = $("<tr id='tr_" + music[j]["live_id"] + "' ></tr>");
                changeBgColor(row, lamp_colors[music_localData["lamp"]]);
                //symbol
                $("<td id='td_symbol'>" + symbol + lv + "</td>").appendTo(row);
                //lamp
                // $("<td id='td_lamp'><i class='gg-pen' id='edit_" + music[j]["live_id"] + "' onclick='editInfo(this.id)' " + "></i></td>").appendTo(row);
                $("<td id='td_lamp'><img src='./imgs/pen.png'></td>").appendTo(row);
                //jacket
                $("<td id='td_jacket'><img src='" + root_path["upload"] + music[j]["cover_path"] + "' oncontextmenu='return false;'></td>").appendTo(row);
                //Title
                $("<td id='td_title'><a href=" + root_path["live"] + music[j]["live_id"] + " target='_blank'>" + music[j]["live_name"] + "</a></td>").appendTo(row);
                //Artist
                $("<td id='td_artist'>" + music[j]["artist"] + "</td>").appendTo(row);
                //Author
                $("<td id='td_author'>" + music[j]["author"] + "</td>").appendTo(row);
                //Level(公式難易度)
                $("<td id='td_level'>" + music[j]["level"] + "</td>").appendTo(row);
                //Score(localStorage["live_id"]で管理)
                if(music_localData["lamp"] === "NO PLAY"){
                    $("<td id='td_score'>" + "NO PLAY" + "</td>").appendTo(row);
                }else{
                    $("<td id='td_score'>" + music_localData["score"] + "</td>").appendTo(row);
                }
                //追加
                $("#lv" + lv).find(".ac_inner .box_one tbody").append(row);
            }
            $("#lv" + lv).find(".ac2_header .lamp_cnt_header").text(getLevelLampStatus(lv));
        }
    }
}
function makeFavoriteFolder(){
    let symbol = header_info["symbol"];
    let music = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["fav"] === true);
    music.sort((a, b) => {
        a = a["live_name"].toString().toLowerCase();
        b = b["live_name"].toString().toLowerCase();
        if(a < b) return -1;
        else if(a > b) return 1;
        return 0;
    });
    // アコーディオン部
    if(!$("#favorite").length){
        $("#custom_folder").append("<div class='ac2_one' id='favorite'><div class='ac2_header'><div class='items_header'><div class='symbol_header'>" + "FAVORITE" + "</div>" +
            "</div></div><div class='ac_inner'>");
        $("#favorite").find(".ac_inner").append("<table class='box_one' id='table_int'></table>");
        // 表のヘッダ追加 ["(symbol)", "(lamp)", "(jacket)", Title, Artist, Author, Level, Score]
        $("#favorite").find(".ac_inner .box_one").append("<thead class='table-dark'><tr><th id='th_symbol'>"+ symbol +"</th><th id='th_lamp'></th>" +
            "<th id='th_jacket'></th><th id='th_title' data-sort='None'>Title</th><th id='th_artist' data-sort='None'>Artist</th><th id='th_author' data-sort='None'>Author</th><th id='th_level' data-sort='None'>Level</th><th id='th_score' data-sort='None'>Score</th></tr></thead><tbody>");
    }else{
        $("#favorite").find(".ac_inner .box_one tbody").html("");
    }

    for(let j = 0; j < music.length; ++j){
        let lv = music[j]["★"];
        //localStorage["live_id"] からクリア状況データを取得
        let music_localData = getMusic_LocalData(music[j]["live_id"]);
        // music[j]["live_id"] から row を特定できるようにする
        let row = $("<tr id='tr_" + music[j]["live_id"] + "' ></tr>");
        changeBgColor(row, lamp_colors[music_localData["lamp"]]);
        //symbol
        $("<td id='td_symbol'>" + symbol + lv + "</td>").appendTo(row);
        //lamp
        // $("<td id='td_lamp'><i class='gg-pen' id='edit_" + music[j]["live_id"] + "' onclick='editInfo(this.id)' " + "></i></td>").appendTo(row);
        $("<td id='td_lamp'><img src='./imgs/pen.png'></td>").appendTo(row);
        //jacket
        $("<td id='td_jacket'><img src='" + root_path["upload"] + music[j]["cover_path"] + "' oncontextmenu='return false;'></td>").appendTo(row);
        //Title
        $("<td id='td_title'><a href=" + root_path["live"] + music[j]["live_id"] + " target='_blank'>" + music[j]["live_name"] + "</a></td>").appendTo(row);
        //Artist
        $("<td id='td_artist'>" + music[j]["artist"] + "</td>").appendTo(row);
        //Author
        $("<td id='td_author'>" + music[j]["author"] + "</td>").appendTo(row);
        //Level(公式難易度)
        $("<td id='td_level'>" + music[j]["level"] + "</td>").appendTo(row);
        //Score(localStorage["live_id"]で管理)
        if(music_localData["lamp"] === "NO PLAY"){
            $("<td id='td_score'>" + "NO PLAY" + "</td>").appendTo(row);
        }else{
            $("<td id='td_score'>" + music_localData["score"] + "</td>").appendTo(row);
        }
        //追加
        $("#favorite").find(".ac_inner .box_one tbody").append(row);
    }
}
function makeCustomFolder(){
    let symbol = header_info["symbol"];
    //Favorite フォルダ
    makeFavoriteFolder();
    //RECOMMEND フォルダ
    let rec_music = getTodayRecommend(num_recommend);
    if(rec_music.length){
        // アコーディオン部
        $("#custom_folder").append("<div class='ac2_one' id='recommend'><div class='ac2_header'><div class='items_header'><div class='symbol_header'>" + "RECOMMEND" + "</div>" +
            "</div></div><div class='ac_inner'></div>");
        $("#recommend").find(".ac_inner").append("<table class='box_one' id='table_int'></table>");
        // 表のヘッダ追加 ["(symbol)", "(lamp)", "(jacket)", Title, Artist, Author, Level, Score]
        $("#recommend").find(".ac_inner .box_one").append("<thead class='table-dark'><tr><th id='th_symbol'>"+ symbol +"</th><th id='th_lamp'></th><th id='th_jacket'></th><th id='th_title' data-sort='None'>Title</th><th id='th_artist' data-sort='None'>Artist</th><th id='th_author' data-sort='None'>Author</th><th id='th_level' data-sort='None'>Level</th><th id='th_score' data-sort='None'>Score</th></tr></thead><tbody>");
        // 行追加
        for(let j = 0; j < rec_music.length; ++j){
            let lv = rec_music[j]["★"];
            //localStorage["live_id"] からクリア状況データを取得
            let rec_music_localData = getMusic_LocalData(rec_music[j]["live_id"]);
            // music[j]["live_id"] から row を特定できるようにする
            let row = $("<tr id='tr_" + rec_music[j]["live_id"] + "' ></tr>");
            changeBgColor(row, lamp_colors[rec_music_localData["lamp"]]);
            //symbol
            $("<td id='td_symbol'>" + symbol + lv + "</td>").appendTo(row);
            //lamp
            // $("<td id='td_lamp'><i class='gg-pen' id='edit_" + music[j]["live_id"] + "' onclick='editInfo(this.id)' " + "></i></td>").appendTo(row);
            $("<td id='td_lamp'><img src='./imgs/pen.png'></td>").appendTo(row);
            //jacket
            $("<td id='td_jacket'><img src='" + root_path["upload"] + rec_music[j]["cover_path"] + "' oncontextmenu='return false;'></td>").appendTo(row);
            //Title
            $("<td id='td_title'><a href=" + root_path["live"] + rec_music[j]["live_id"] + " target='_blank'>" + rec_music[j]["live_name"] + "</a></td>").appendTo(row);
            //Artist
            $("<td id='td_artist'>" + rec_music[j]["artist"] + "</td>").appendTo(row);
            //Author
            $("<td id='td_author'>" + rec_music[j]["author"] + "</td>").appendTo(row);
            //Level(公式難易度)
            $("<td id='td_level'>" + rec_music[j]["level"] + "</td>").appendTo(row);
            //Score(localStorage["live_id"]で管理)
            if(rec_music_localData["lamp"] === "NO PLAY"){
                $("<td id='td_score'>" + "NO PLAY" + "</td>").appendTo(row);
            }else{
                $("<td id='td_score'>" + rec_music_localData["score"] + "</td>").appendTo(row);
            }
            //追加
            $("#recommend").find(".ac_inner .box_one tbody").append(row);
        }
    }
    // [A to Z & OTHERS フォルダ]
    for(let i = 0; i < initial_regax.length; ++i){
        let regax_key = initial_regax[i];
        let regax_key_id = regax_key.split(".").join("");
        let music = insane_chart_info.filter(c => initial_regex_pt[regax_key].test(c["live_name"]));
        music.sort((a, b) => {
            a = a["live_name"].toString().toLowerCase();
            b = b["live_name"].toString().toLowerCase();
            if(a < b) return -1;
            else if(a > b) return 1;
            return 0;
        });
        // 該当する譜面が存在すればアコーディオンリスト 1 つ生成
        if(music.length) {
            // アコーディオン部
            $("#custom_folder").append("<div class='ac2_one'" + "id=" + regax_key_id + "><div class='ac2_header'><div class='items_header'><div class='symbol_header'>" + regax_key + "</div>" +
                "</div></div><div class='ac_inner'></div>");
            $("#" + regax_key_id).find(".ac_inner").append("<table class='box_one' id='table_int'></table>");
            // 表のヘッダ追加 ["(symbol)", "(lamp)", "(jacket)", Title, Artist, Author, Level, Score]
            $("#" + regax_key_id).find(".ac_inner .box_one").append("<thead class='table-dark'><tr><th id='th_symbol'>"+ symbol +"</th><th id='th_lamp'></th><th id='th_jacket'></th><th id='th_title'>Title</th><th id='th_artist'>Artist</th><th id='th_author'>Author</th><th id='th_level'>Level</th><th id='th_score'>Score</th></tr></thead><tbody>");
            // 行追加
            for(let j = 0; j < music.length; ++j){
                let lv = music[j]["★"];
                //localStorage["live_id"] からクリア状況データを取得
                let music_localData = getMusic_LocalData(music[j]["live_id"]);
                // music[j]["live_id"] から row を特定できるようにする
                let row = $("<tr id='tr_" + music[j]["live_id"] + "' ></tr>");
                changeBgColor(row, lamp_colors[music_localData["lamp"]]);
                //symbol
                $("<td id='td_symbol'>" + symbol + lv + "</td>").appendTo(row);
                //lamp
                $("<td id='td_lamp'><img src='./imgs/pen.png'></td>").appendTo(row);
                //jacket
                $("<td id='td_jacket'><img src='" + root_path["upload"] + music[j]["cover_path"] + "' oncontextmenu='return false;'></td>").appendTo(row);
                //Title
                $("<td id='td_title'><a href=" + root_path["live"] + music[j]["live_id"] + ">" + music[j]["live_name"] + "</a></td>").appendTo(row);
                //Artist
                $("<td id='td_artist'>" + music[j]["artist"] + "</td>").appendTo(row);
                //Author
                $("<td id='td_author'>" + music[j]["author"] + "</td>").appendTo(row);
                //Level(公式難易度)
                $("<td id='td_level'>" + music[j]["level"] + "</td>").appendTo(row);
                //Score(localStorage["live_id"]で管理)
                if(music_localData["lamp"] === "NO PLAY"){
                    $("<td id='td_score'>" + "NO PLAY" + "</td>").appendTo(row);
                }else{
                    $("<td id='td_score'>" + music_localData["score"] + "</td>").appendTo(row);
                }
                //追加
                $("#" + regax_key_id).find(".ac_inner .box_one tbody").append(row);
            }
        }
    }
}
function makeDaniFolder(){
    let symbol = header_info["symbol"];
    let rounds =["1st", "2nd", "3rd", "FINAL"];
    let season = header_info["season"][header_info["season"].length - 1]; // 今のシーズンを取得
    let m_list = dani_info["season_" + season];
    for(let i=0; i<dani_rank.length; i++){
        let m_ids = m_list[dani_rank[i]]
        // アコーディオン部
        $("#dani_folder").append("<div class='ac2_one'" + "id=" + dani_rank[i] + "><div class='ac2_header'><div class='items_header'><div class='symbol_header'><img class='dani_image' alt='dani' src='./imgs/dani/panel_" + dani_rank[i] + ".png'></div>" +
            "</div></div><div class='ac_inner'></div>");
        $("#" + dani_rank[i]).find(".ac_inner").append("<table class='box_one' id='table_int'></table>");
        // 表のヘッダ追加 ["(round)", "(symbol)", "(jacket)", Title, Artist, Author]
        $("#" + dani_rank[i]).find(".ac_inner .box_one").append("<thead class='table-dark'><tr><th id='th_dani_round'>Round</th><th id='th_dani_symbol'>"+ symbol +"</th><th id='th_dani_jacket'></th><th id='th_dani_title'>Title</th><th id='th_dani_artist'>Artist</th><th id='th_dani_author'>Author</th></tr></thead><tbody>");
        // 行追加
        for(let j=0; j<m_ids.length; j++){
            let music = insane_chart_info.filter(c => c["live_id"] === m_ids[j])[0];
            let lv = music["★"];
            // music[j]["live_id"] から row を特定できるようにする
            let row = $("<tr id='tr_" + music["live_id"] + "' ></tr>");
            let music_localData = getMusic_LocalData(music["live_id"]);
            changeBgColor(row, lamp_colors[music_localData["lamp"]]);
            //round
            $("<td id='td_round'>" + rounds[j] + "</td>").appendTo(row);
            //symbol
            $("<td id='td_symbol'>" + symbol + lv + "</td>").appendTo(row);
            //jacket
            $("<td id='td_jacket'><img src='" + root_path["upload"] + music["cover_path"] + "' oncontextmenu='return false;'></td>").appendTo(row);
            //Title
            $("<td id='td_title'><a href=" + root_path["live"] + music["live_id"] + ">" + music["live_name"] + "</a></td>").appendTo(row);
            //Artist
            $("<td id='td_artist'>" + music["artist"] + "</td>").appendTo(row);
            //Author
            $("<td id='td_author'>" + music["author"] + "</td>").appendTo(row);

            //追加
            $("#" + dani_rank[i]).find(".ac_inner .box_one tbody").append(row);
        }
        //Status
        $("#" + dani_rank[i]).find(".ac_inner .box_one tbody").append("<tr><td style='border-bottom: none;' colspan=6 class= 'td_status' id='td_status_lamp"+ dani_rank[i] +"'><span class='dani_lamp'>" +
            "<img src='" + dani_lamp_imgs[getDaniScore()[dani_rank[i]]["lamp"]] + "' oncontextmenu='return false;'></span></td></tr>");
        $("#" + dani_rank[i]).find(".ac_inner .box_one tbody").append("<tr><td style='border-bottom: none; border-top: none;' colspan=6 class= 'td_status' id='td_status_score"+ dani_rank[i] +"'>" +
            "<span class='dani_score'>"+getDaniScore()[dani_rank[i]]["total_score"].toString(10).padStart(7, "0")+"</span></td></tr>");
        //Challenge
        $("#" + dani_rank[i]).find(".ac_inner .box_one tbody").append("<tr><td style='border-top: none;' colspan=6 class= 'td_challenge' id='td_challenge_"+ dani_rank[i] +"'><input id='dani_button' type='button' value='CHALLENGE'></td></tr>");
        //クリア条件
        // $("#" + dani_rank[i]).find(".ac_inner .box_one").append("<div class='clear_requirememts'><span>CLEAR 条件</span><span>合計スコア 3700000 以上</span></div>");
    }
}

async function makeCourseFolder() {
    let symbol = header_info["symbol"];
    let rounds = ["1st", "2nd", "3rd", "FINAL"];
    let data = new Date();
    console.log("日本現在時間:" + data)
    console.log("getJST:" + getJST())
    let utc = data.toGMTString();
    console.log("標準現在時間:" + utc)
    let oyo = new Date("May 14 2022 03:00:00 GMT+0900");
    console.log(oyo)
    console.log(oyo < getJST())
    console.log(oyo < utc)
    // console.log("サーバー変換時間:" + changeJSTDate(serverTime))
    for (let i = 0; i < course_info.length; i++) {
        console.log(course_info[i]);
    }
    let usersRef = fb_fs.collection(db, "users");
    let userDoc = fb_fs.doc(usersRef, auth.currentUser.uid); //uid を指定して単一のドキュメントを参照
    let m;
    const userSnap = await fb_fs.getDoc(userDoc).then((snap) => {
        console.log(snap.data()["created_at"].toDate())
        console.log(snap.data()["created_at"].toDate())
        m = snap.data()["created_at"].toDate();
        console.log(snap.data()["created_at"].toDate().getTimezoneOffset());
    });

    let a = new Date("May 13 2022 00:15:47 GMT+0900");
    let b = new Date("May 13 2022 00:16:00 GMT+0900");
    let c = new Date("5 15 2022 02:51:00 GMT+0900");
    console.log(a.getFullYear(), a.getMonth() + 1, a.getDate(), a.getHours(), a.getMinutes(), a.getSeconds())
    console.log(m.getFullYear(), m.getMonth() + 1, m.getDate(), m.getHours(), m.getMinutes(), m.getSeconds())
    console.log(getJST().getFullYear(), getJST().getMonth() + 1, getJST().getDate(), getJST().getHours(), getJST().getMinutes(), getJST().getSeconds())
    console.log(b.getFullYear(), b.getMonth() + 1, b.getDate(), b.getHours(), b.getMinutes(), b.getSeconds())
    console.log(isWithinRangeDays(m,a, b));
    console.log(changeHour(a, 1))
    console.log(changeHour(a, -1))
    console.log(changeHour(b, -10))
    console.log(changeHour(c, 10))
    console.log(changeMinutes(a, 1))
    console.log(changeMinutes(a, -1))
    console.log(changeMinutes(a, -10))
    console.log(changeMinutes(a, 10))
    console.log(changeMinutes(a, -20))
    console.log(changeMinutes(a, 20))
    console.log(isWithinRangeDays(a, changeMinutes(a, 1), changeMinutes(a, 20)));
}
function makeIRFolder(){

}

function makeStats(){
    let obj = $("#app");
    obj.html(""); // 初期化
    $("#panel").css("visibility", "hidden"); //パネル隠す
    $("#panel").html("");
    let lamp_stats = setLampStatus();
    let ave_scores = {};
    let ave_scores_round = {};
    for(let i=0; i<header_info["level_order"].length; i++){
        ave_scores["★" + header_info["level_order"][i]] = calAveScore(header_info["level_order"][i]);
        ave_scores_round[["★" + header_info["level_order"][i]]] =parseFloat(((calAveScore(header_info["level_order"][i]))*100/max_score).toFixed(1));
    }
    obj.load("./tmp/StatsPage.html", function (){
        //self_name
        $("#prof_name").children().eq(1).text(getUserInfo()["user_name"]);
        //self_img
        //self_profile
        $("#prof_skill_pt").children().eq(1).text(getSkillPoint().point.toFixed(1));
        //ave_score
        drawChart($("#score_chart"), ave_scores_round);
        //skill_pt
        //dani
    });
}

// グラフ描画処理
function drawChart(ctx_obj, data) {
    let ctx = ctx_obj;
    window.score_chart = new Chart(ctx, { // インスタンスをグローバル変数で生成
        type: 'bar',
        data: { // ラベルとデータセット
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: 'rgba(0, 134, 197, 0.7)', // 棒の塗りつぶし色
                borderColor: 'rgba(0, 134, 197, 1)', // 棒の枠線の色
                borderWidth: 1, // 枠線の太さ
            }],
        },
        options: {
            responsive: true,  // canvasサイズ自動設定機能を使わない。HTMLで指定したサイズに固定
            scales: {
                xAxes: [{
                    display: true,
                    gridLines: {                   // 補助線
                        color: "rgba(255, 255, 255, 0.25)", // 補助線の色
                    },
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "(%)"
                    },
                    display: true,
                    gridLines: {                   // 補助線
                        color: "rgba(255, 255, 255, 0.25)", // 補助線の色
                    },
                    ticks: {
                        min: Math.max(parseInt((Math.min(...Object.values(data)) - 10)/10)*10 , 0), // 最小値
                        max: Math.max(Math.max(...Object.values(data)), 100) // 最大値
                    },
                }],

            },
            legend: {
                display: false, // 凡例を非表示
            },

        }
    });
}

//タブ切替 default folder <=> custom folder
$(document).on('click', '#app .tab_area .tab_button', function (){
    let index = $("#app .tab_area .tab_button").index(this);
    $("#app .folder_content, #app .tab_area .tab_button").removeClass("folder_active");
    $(this).addClass('folder_active');
    $('#app .folder_content').eq(index).addClass("folder_active");
});

//アコーディオン開け閉め
$(document).on('click','#app .ac2_one .ac2_header',function(){
    //クリックされた.ac_oneの中の.ac_headerに隣接する.ac_innerが開いたり閉じたりする
    $(this).next('.ac_inner').slideToggle();
    $(this).toggleClass("open");
});

//td_lamp penのアイコンクリックしたらeditInfo(ポップアップを呼ぶ)
$(document).on('click','#app .ac_inner #td_lamp',function(){
    //親の tr_(live_id) はユニーク
    let p_id = $(this).parent().attr('id');
    editInfo(p_id.slice(3)); // "tr_" の 3 文字分消す
});

// ランプ更新
$(document).on('change', '#lamp_menu', function(){
    let r = $(this).val();
    console.log(r)
    let id = $(this).attr('class');
    let m_data = getMusic_LocalData(id);
    changeBgColor($("#default_folder #tr_" + id), lamp_colors[r]);
    changeBgColor($("#custom_folder #tr_" + id), lamp_colors[r]);
    $('#score_box').prop("disabled", r === 'NO PLAY');
    //scoreテキストも更新
    changeScoreText($("#default_folder #tr_" + id), r, m_data['score']);
    changeScoreText($("#custom_folder #tr_" + id), r, m_data['score']);
    //セーブデータ更新
    m_data['lamp'] = r;
    localStorage.setItem(id, JSON.stringify(m_data));
    //アコーディオンヘッダ内の lampStatusも変更
    let lv = insane_chart_info.filter(c => c["live_id"] === id)[0]["★"];
    $("#lv" + lv).find(".ac2_header .lamp_cnt_header").text(getLevelLampStatus(lv));
    //パネル内の lampstatusも変更
    setLampStatus();
    //skillPoint 再計算
    updateSkillPoint(id, insane_chart_info.filter(c => c["live_id"] == id)[0]);
});

// スコア更新
$(document).on('change', '#score_box', function() {
    let v = $(this).val();
    let id = $(this).attr('class');
    let m_data = getMusic_LocalData(id);
    //整数値以外をはじく (最大値 1000000)
    if(isNumber(v) && parseInt(v) <= max_score){
        changeScoreText($("#default_folder #tr_" + id), m_data['lamp'], v);
        changeScoreText($("#custom_folder #tr_" + id), m_data['lamp'], v);
        m_data['score'] = v;
        localStorage.setItem(id, JSON.stringify(m_data));
    }else{
        $(this).val(m_data['score']);
    }
    //skillPoint 再計算
    updateSkillPoint(id, insane_chart_info.filter(c => c["live_id"] == id)[0]);
});

//ファボ更新
$(document).on('click', '#fav_icon', function (){
    let id = $("#editInfo_fav").attr('class');
    let m_data = getMusic_LocalData(id);
    m_data['fav'] = !m_data['fav'];
    localStorage.setItem(id, JSON.stringify(m_data));
    $(this).toggleClass("fas");
    makeFavoriteFolder();
});

//範囲外クリックでポップアップ消す
$(document).on('click', function(e) {
    // ２．クリックされた場所の判定
    if(!$(e.target).closest('.popup_content').length && !$(e.target).closest('#td_lamp').length){
        if(!$('.popup').is(':hidden')){
            $('.popup').fadeOut();
        }
    }
});

//Table ソート
$(document).on('click', '#th_title, #th_artist, #th_author, #th_level, #th_score', function (){
    // 情報取得
    let ele = $(this).index();
    let asc_symbol = "▲";
    let desc_symbol = "▼";

    let siblings = $(this).parent().find("th");
    for(let i=0; i<siblings.length; i++){
        let text = siblings.eq(i).text();
        siblings.eq(i).text(text.replace(asc_symbol,"").replace(desc_symbol,""));
    }
    let th_text = $(this).text();
    let target_obj = $(this).parent().parent().next().children();
    let sortFlg = $(this).data('sort');
    $(this).data('sort', '')
    // ソート順序
    if(sortFlg === "" || sortFlg === "desc"){
        sortFlg = "asc";
        $(this).data('sort', "asc");
        $(this).text(th_text+asc_symbol);
    }else{
        sortFlg = "desc";
        $(this).data('sort', "desc");
        $(this).text(th_text+desc_symbol);
    }
    // テーブルソート処理
    sortTable(ele, target_obj, sortFlg);
});

function sortTable(ele, tar, sortFlg){
    let arr = tar.sort(function (a, b){
        // ソート対象が数値の場合
        if($.isNumeric(($(a).find('td').eq(ele).text() !== 'NO PLAY') ? $(a).find('td').eq(ele).text() : 0)){
            // "NO PLAY は下に表示
            let aNum, bNum;
            if(sortFlg === "desc"){
                aNum = ($(a).find('td').eq(ele).text() !== 'NO PLAY') ? Number($(a).find('td').eq(ele).text()) : min_score - 1;
                bNum = ($(b).find('td').eq(ele).text() !== 'NO PLAY') ? Number($(b).find('td').eq(ele).text()) : min_score - 1;
            }else{
                aNum = ($(a).find('td').eq(ele).text() !== 'NO PLAY') ? Number($(a).find('td').eq(ele).text()) : max_score + 1;
                bNum = ($(b).find('td').eq(ele).text() !== 'NO PLAY') ? Number($(b).find('td').eq(ele).text()) : max_score + 1;
            }


            if(sortFlg == "asc"){
                return aNum - bNum;
            }else{
                return bNum - aNum;
            }
        }else{ // ソート対象が数値でない場合
            let sortNum = 1;

            // 比較時は小文字に統一
            if($(a).find('td').eq(ele).text().toLowerCase() > $(b).find('td').eq(ele).text().toLowerCase()){
                sortNum = 1;
            }else{
                sortNum = -1;
            }
            if(sortFlg == "desc"){
                sortNum *= (-1);
            }

            return sortNum;
        }
    });
    tar.parent().html(arr);
}

function editInfo(id){
    let target = insane_chart_info.filter(c =>  c["live_id"] === id)[0];
    console.log(target["live_id"])
    //ポップアップ画面作成
    var obj = $(".popup");
    obj.html(""); // 初期化

    $("<div class='popup_content'></div>").appendTo(obj);
    $(".popup_content").append("<div class='box_info'></div>");
    $(".box_info").load("./tmp/editInfoTable.html", function (){
        $("#editInfo_jacket").attr("src", root_path["upload"] + target["cover_path"]);
        $("#editInfo_jacket_container").css({'background-image': 'url(' + root_path["upload"] + target["cover_path"] + ')'})
        $("#editInfo_title").text(target["live_name"]);
        $("#editInfo_artist").text(target["artist"]);
        $("#lamp_menu").val(getMusic_LocalData(target["live_id"])['lamp']);
        $("#score_box").val(getMusic_LocalData(target["live_id"])['score']);
        $("#lamp_menu").attr('class', target["live_id"]);
        $("#score_box").attr('class', target["live_id"]);
        $("#score_box").prop("disabled", getMusic_LocalData(target["live_id"])['lamp'] === 'NO PLAY');
        $("#editInfo_fav").attr('class', target["live_id"]);
        if(getMusic_LocalData(target["live_id"])['fav']){
            $("#fav_icon").toggleClass("fas");
        }
    });
    //表示
    $('.popup').addClass('popup_show').fadeIn();
}




//Aboutページ遷移
$(document).on('click','#nav_about',function(){
    makeAbout();
});
//難易度表ページ遷移
$(document).on('click','#nav_charts',function(){
    makeTable();
});
//段位認定ページ遷移
$(document).on('click','#nav_dani',function(){
    makeDaniTable();
});
//Statsページ遷移
$(document).on('click','#nav_stats',function(){
    makeStats();
});
//Settingページ遷移
$(document).on('click','#nav_setting',function(){
    makeSetting();
});

function makeAbout(){
    let obj = $("#app");
    obj.html(""); // 初期化
    hiddenPanel();
    obj.load("./tmp/AboutPage.html", function (){
    });
}
function makeDaniTable(){
    // 現シーズンの段位認定 dani_info["season_" + header_info["season"].slice(-1)[0]]
    let obj = $("#app");
    obj.html(""); // 初期化
    hiddenPanel();
    obj.load("./tmp/daniTable.html", function (){
        //発狂段位 folder
        makeDaniFolder();
        //Course folder
        makeCourseFolder();
        //IR Folder
        makeIRFolder();
    });

}

function makeSetting(){
    let obj = $("#app");
    obj.html(""); // 初期化
    hiddenPanel();
    obj.load("./tmp/SettingPage.html", function (){
        setLoginStatusToObj();
    });
}



// __________________________________________________________________________________________
// ******************************************************************************************
// 雑多
// ******************************************************************************************
// __________________________________________________________________________________________
class OriginalRandom {
    constructor(seed = 19681106) {
        this.x = 31415926535;
        this.y = 8979323846;
        this.z = 2643383279;
        this.w = seed;
    }
    // XorShift
    next() {
        let t;
        t = this.x ^ (this.x << 11);
        this.x = this.y; this.y = this.z; this.z = this.w;
        return this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
    }
    // min以上max以下の乱数を生成する
    nextInt(min, max) {
        const r = Math.abs(this.next());
        return min + (r % (max + 1 - min));
    }
}
//画像preload
function imgPreload(img_paths) {
    for(var i = 0; i< img_paths.length; i++){
        $("<img>").attr("src", img_paths[i]);
    }
}
function daniImgsPreload(){
    let arr = [];
    for(let i=0; i< dani_rank.length; i++){
        arr.push('./imgs/dani/panel_' + dani_rank[i] + '.png')
    }
    arr.push('./imgs/dani/clear.png');
    arr.push('./imgs/dani/ex_clear.png');
    arr.push('./imgs/dani/failed.png');
    arr.push('./imgs/dani/no_play.png');
    imgPreload(arr);
}

function getJST(){
    // 取得できる値は必ず日本時間になる
    const jstNow = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));
    return jstNow;
}
function changeHour(time, value){
    let tmp = new Date(time);
    let res = new Date(tmp.setHours(tmp.getHours() + value));
    return res;
}
function changeMinutes(time, value){
    let tmp = new Date(time);
    let res = new Date(tmp.setMinutes(tmp.getMinutes() + value));
    return res;
}
let isWithinRangeDays = function(targetDate, rangeStartDate, rangeEndDate) {
    let targetDateTime, rangeStartTime, rangeEndTime;
    let startFlag = false;
    let endFlag = false;

    let targetDateArr = [targetDate.getUTCFullYear(), targetDate.getUTCMonth()+1, targetDate.getUTCDate(), targetDate.getUTCHours(), targetDate.getUTCMinutes(), targetDate.getUTCSeconds()];
    let rangeStartDateArr = [rangeStartDate.getUTCFullYear(), rangeStartDate.getUTCMonth()+1, rangeStartDate.getUTCDate(), rangeStartDate.getUTCHours(), rangeStartDate.getUTCMinutes(), rangeStartDate.getUTCSeconds()];
    let rangeEndDateArr = [rangeEndDate.getUTCFullYear(), rangeEndDate.getUTCMonth()+1, rangeEndDate.getUTCDate(), rangeEndDate.getUTCHours(), rangeEndDate.getUTCMinutes(), rangeEndDate.getUTCSeconds()];
    if (!targetDate) return false;

    var isArray = function(array) {
        return (Object.prototype.toString.call(array) === '[object Array]');
    };

    // 日時をミリ秒で取得する関数
    var getDateTime = function(dateObj) {
        if (!dateObj) return;

        if (typeof dateObj.getTime !== 'undefined') {
            return dateObj.getTime();
        } else if (isArray(dateObj)) {
            if (dateObj.length === 3) {
                return new Date(dateObj[0], Number(dateObj[1]) - 1, dateObj[2]).getTime();
            } else {
                return new Date(dateObj[0], Number(dateObj[1]) - 1, dateObj[2], dateObj[3], dateObj[4], dateObj[5]).getTime();
            }
        }

        return;
    };

    targetDateTime = getDateTime(targetDateArr);
    rangeStartTime = getDateTime(rangeStartDateArr);
    rangeEndTime   = getDateTime(rangeEndDateArr);

    if (!targetDateTime) return false;

    if (rangeStartDate) {
        if (rangeStartTime && targetDateTime >= rangeStartTime) {
            startFlag = true;
        }
    } else {
        startFlag = true;
    }

    if (rangeEndDate) {
        if (rangeEndTime && targetDateTime <= rangeEndTime) {
            endFlag = true;
        }
    } else {
        endFlag = true;
    }

    if (startFlag && endFlag) return true;

    return false;
};

// 日付固定のレコメンド譜面を取得
function getTodayRecommend(num){
    let dt = new Date();
    let y = dt.getFullYear();
    let m = dt.getMonth() + 1;
    m = ( ( m < 10 ) ? '0' : '' ) + m;
    let d = dt.getDate();
    d = ( ( d < 10 ) ? '0' : '' ) + d;
    //. 今日の午前零時のタイムスタンプをシードとして取得
    dt = new Date( y + '/' + m + '/' + d + ' 00:00:00' );
    let seed = dt.getTime();
    //. 今日の午前零時のタイムスタンプをシードに関数を初期化
    let random = new OriginalRandom(seed);
    let res = [];
    while(res.length<num){
        let item = insane_chart_info[random.nextInt(0, insane_chart_info.length-1)];
        if(item in res === false){
            res.push(insane_chart_info[random.nextInt(0, insane_chart_info.length-1)]);
        }
    }
    res.sort((a, b) => {
        a = a["live_name"].toString().toLowerCase();
        b = b["live_name"].toString().toLowerCase();
        if(a < b) return -1;
        else if(a > b) return 1;
        return 0;
    });
    return res;
}

// ランセレ 本体 譜面の選定
function getRandomSelect(){
    // レベルで絞り込み
    const level = $("#randomLevel").val();
    const relational = $("#randomRelational").val();
    let candidates;
    if (relational === "eq"){
        candidates = insane_chart_info.filter(e => parseInt(e["★"]) == level);
    }else if(relational === "leq"){
        candidates = insane_chart_info.filter(e => parseInt(e["★"]) <= level);
    }else{
        candidates = insane_chart_info.filter(e => parseInt(e["★"]) >= level);
    }
    if(!candidates.length){alert('該当する作品がありません'); return undefined;}
    const rnd = ~~(Math.random() * candidates.length);
    return root_path["live"] + candidates[rnd]["live_id"];
}
// ランセレ 呼び出し
function randomSelect() {
    const url = getRandomSelect();
    if (url) {
        localStorage["selectRandomCnt"] = Number(localStorage["selectRandomCnt"]) + 1 || 1;
        // document.location = url;
        window.open(url, "_blank");
    }
}
//ランセレボタン押したとき
$(document).on('click','#randomSelectButton',function(){
    console.log("random select");
    randomSelect();
});

function hiddenPanel(){
    $("#panel").css("visibility", "hidden");
    $("#panel").html("");
}
//localStorage サイズ計算
function checkLocalStorageSize(){
    let _lsTotal = 0,
        _xLen, _x;
    for (_x in localStorage) {
        if (!localStorage.hasOwnProperty(_x)) {
            continue;
        }
        _xLen = ((localStorage[_x].length + _x.length) * 2);
        _lsTotal += _xLen;
    }
    console.log("localStorage Total = " + (_lsTotal / 1024).toFixed(2) + " KB");
}
function isNumber(numVal){
    // チェック条件パターン
    const pattern = RegExp(/^([1-9]\d*|0)$/);
    // 数値チェック
    return pattern.test(numVal);
}

function getLocalStorage(key){
    return JSON.parse(localStorage.getItem(key));
}
function  setLocalStorage(key, value){
    localStorage.setItem(key, JSON.stringify(value));
}

function compressLocalStorage(){
    const res = {};
    let NG_list = ["user_info"];

    for (let key in localStorage) {
        console.log(localStorage.hasOwnProperty("skill_point"));
        if (localStorage.hasOwnProperty(key)) {
            if(NG_list.indexOf(key) === -1){
                res[key] = getLocalStorage(key);
                console.log(key, getLocalStorage(key));
            }
        }
    }
    const compressed = JSON.stringify(res);
    // const compressed = pako.deflate(JSON.stringify(res), { to: 'string' });
    return compressed;
}

function decompressLocalStorage(compressed){
    const restored = JSON.parse(compressed);
    // const restored = JSON.parse(pako.inflate(compressed, { to: 'string' }));
    return restored;
}

function assignBackUpData(data){
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            setLocalStorage(key, data[key]);
        }
    }
    //TODO skill_point 再計算
    initializeSkillPointTable();
}

// __________________________________________________________________________________________
// ******************************************************************************************
// firebase 関連
// ******************************************************************************************
// __________________________________________________________________________________________
function checkLogin(){
    return auth.currentUser !== null;
}
//ログイン状態でon offする要素
function setLoginStatusToObj(){
    if(checkLogin()){
        $(".login_only").css("display", "block");
        $("#login_button, #login_password, #login_email, #login-page .message a").prop("disabled", true);
    }else{
        $(".login_only").css("display", "none");
        $("#login_button, #login_password, #login_email, #login-page .message a").prop("disabled", false);
    }
}
$(document).ready(function () {


    // getTestData();


});

async function getTestData(){
    const querySnapshot = await fb_fs.getDocs(fb_fs.query(fb_fs.collectionGroup(db, "IR_shodan_season_0"), fb_fs.orderBy("total_score", "desc")));
    querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => ${doc.data()["total_score"]}`);
    });
    let hoge = fb_fs.doc(fb_fs.collection(db, "dani_season_0"), "shodan_season_0", "IR_shodan_season_0" ,auth.currentUser.uid);
    const docSnap = await fb_fs.getDoc(hoge);
    console.log(docSnap.id, docSnap.data());
    await fb_fs.updateDoc(hoge, {"total_score":777777}).then(() =>{ console.log(docSnap.id, docSnap.data());});
}
async function initUserDoc(uid, email, user_name='no name'){
    //ログイン済みのユーザー情報があるかをチェック
    console.log("uid:",uid)
    console.log("email:", email)
    let usersRef = fb_fs.collection(db, "users");
    let userDoc = fb_fs.doc(usersRef, uid); //uid を指定して単一のドキュメントを参照
    const userSnap = await fb_fs.getDoc(userDoc);
    if(!userSnap.exists()){
        let new_data = {
            uid: uid,
            user_name: (user_name.length < 1) ? "no name" : user_name,
            email: email,
            created_at: fb_fs.serverTimestamp(),
        }
        await fb_fs.setDoc(userDoc, new_data);
        localStorage.setItem("user_info", JSON.stringify({"user_name":new_data["user_name"], "uid":uid}));
        console.log("make doc");
    }else{
        console.log("exist doc");
    }
}
async function backupData(){
    let backupDataRef = fb_fs.collection(db, "backupData");
    let userDoc = fb_fs.doc(backupDataRef, auth.currentUser.uid); //uid を指定して単一のドキュメントを参照
    let parser = new UAParser();
    let new_obj = {
        "backupData" : compressLocalStorage(),
        "lastBackupTime": fb_fs.serverTimestamp(),
        "userAgentOS" : parser.getResult()["os"]["name"],
        "userAgentBrowser" : parser.getResult()["browser"]["name"]
    }
    //今の時間を取得
    let now_time = getJST();
    let acceptable_range = 10; // 10分
    await fb_fs.setDoc(userDoc, new_obj)
        .then(() => {
            alert(`success : backup`);
            console.log(`success : backup`);
        })
        .catch((error) => {
            alert(`failed : backup (${error})`);
            console.log(`failed : backup (${error})`);
        });

}
async function recoveryData(){
    let backupDataRef = fb_fs.collection(db, "backupData");
    let userDoc = fb_fs.doc(backupDataRef, auth.currentUser.uid); //uid を指定して単一のドキュメントを参照
    const userSnap = await fb_fs.getDoc(userDoc)
        .then((snap) => {
            let os = snap.data()["userAgentOS"];
            let browser = snap.data()["userAgentBrowser"];
            let lastBackupTime = snap.data()["lastBackupTime"].toDate();
            if(confirm("以下のバックアップデータを読み込みますか?\nos: " + os + ",\nbrowser: " + browser + ",\nbackupTime:\n" + lastBackupTime)) {
                assignBackUpData(decompressLocalStorage(snap.data()["backupData"]));
                alert(`success : recovery`);
                console.log(`success : recovery`);
            }else{
                return;
            }

        })
        .catch((error) => {
            alert(`failed : recovery (${error})`);
            console.log(`failed : recovery (${error})`);
        });
}
//ログイン・サインアップ画面 切替
$(document).on('click','#app #login-page .message a',function(e){
    e.preventDefault();
    let index = $(this).parent().parent().index();
    $(this).parent().parent().removeClass("form_active");
    $('#app #login-page').children().eq((index+1)%2).addClass("form_active");
});
//ログインボタン
$(document).on('click','#app #login_button', _.throttle(function(){
    let email = $("#login_email").val();
    let password = $("#login_password").val();
    fb_auth.signInWithEmailAndPassword(auth, email, password)
        .then((user) => {
            alert(`success : login (${user.user.uid})`);
            console.log(`success : login (${user.user.uid})`);
            initUserDoc(user.user.uid, email, getUserInfo()["user_name"]);
        })
        .catch((error) => {
            $("#login_password").val("");
            alert(`failed : login (${error})`);
            console.log(`failed : login (${error})`);
        })
}, 2000, {trailing: false}));
//サインアップボタン
$(document).on('click','#app #register_button', _.throttle(function(){
    let name = $("#register_name").val()
    let email = $("#register_email").val();
    let password = $("#register_password").val();
    if(name.length < 3){
        alert("Please input name at least 3 characters.");
        return;
    }
    fb_auth.createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert(`success : signup (${userCredential.user.uid})`);
            console.log(`success : signup (${userCredential.user.uid})`);
            initUserDoc(userCredential.user.uid, email, name);
        })
        .catch((error) => {
            $("#login_password").val("");
            alert(`failed : signup (${error})`);
            console.log(`failed : signup (${error})`);
        })
}, 2000, {trailing: false}));
//ログアウトボタン
$(document).on('click','#app #logout_button',function(){
    fb_auth.signOut(auth)
        .then(()=>{
            alert("success : logout");
            console.log("success : logout");
        })
        .catch( (error)=>{
            alert(`failed : logout (${error})`);
            console.log(`failed : logout (${error})`);
        });
});
//ユーザーネーム変更 1分に1回しか変更できません
$(document).on('click','#app #change_user_name_button', _.throttle(function(){
    let val = $("#app #change_user_name").val();
    if(val.length < 3){
        alert("Please input name at least 3 characters.");
        return;
    }else{
        updateUserName(val);
    }
}, 60000, {trailing: false}));
//バックアップボタン
$(document).on('click','#app #backup_button',function(){
    backupData();
});
$(document).on('click','#app #recovery_button',function(){
    recoveryData();
});
