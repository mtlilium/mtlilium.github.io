// 定数
const root_path = {live:"https://m.tianyi9.com/#/getlive?live_id=", upload:"https://m.tianyi9.com/upload/", user:"https://m.tianyi9.com/#/userInfo?uid=", user_info:"https://m.tianyi9.com/API/user_info?uid="};
const lamp_colors = {"NO PLAY": "#dddddde6", "CLEAR": "#ccffcce6", "FULL COMBO": "#ffffcce6"}; // クリアランプの色
const dani_rank = ["初段", "二段", "三段", "四段", "五段", "六段", "七段", "八段", "九段", "十段", "中伝", "皆伝"];
let header_info; // header.json の情報
let chart_info; // ALL
let insane_chart_info; // 発狂難易度表入り譜面
let skill_point_table = []; // skillpoint 計算用テーブル
let skill_point_target_num = 30;
let dani_info;
let max_score = 1000000;
let min_score = 0;
const initial_regex_pt = {"A.B.C.D" : /^[A-Da-d]/, "E.F.G.H" :  /^[E-He-h]/, "I.J.K.L" : /^[I-Li-l]/, "M.N.O.P" :  /^[M-Pm-p]/, "Q.R.S.T" : /^[Q-Tq-t]/, "U.V.W.X.Y.Z" : /^[U-Zu-z]/, "OTHERS" : /^([^A-Za-z])/};
const initial_regax = ["A.B.C.D", "E.F.G.H", "I.J.K.L", "M.N.O.P", "Q.R.S.T", "U.V.W.X.Y.Z", "OTHERS"]
const num_recommend = 10;

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

// セーブデータ
//1. key : live_id, value : {"score": 990125, "lamp": "NO PLAY" or "CLEAR" or "FULL COMBO", "fav": true or false}
//2. key : "user_info", value : {"user_id": 11012, "avatar_path": "url", "max_dani": "三段", "skill_point"}
//3. key : "dani" + season_num, value : {"1":{"score":[1,2,3,4], rate:95, status:"CLEAR" or "EX_CLEAR" or "FAILED"}, ... , "12":{"score":[1,2,3,4], rate:95, status:"CLEAR" or "EX_CLEAR" or "FAILED"}}
//4. key : "skill_point", value : {"point": 334, "targets": {"live_id": 34, ... , "live_id": 25}}


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
    // console.log(skill_point_table)
    // console.log(getSkillPoint())
    let new_obj = {"point": 0.0, "targets": {}};
    new_obj.targets = skill_point_table.filter(function (item){return item.lamp !== "NO PLAY"}).slice(0, tar_num);
    new_obj.point = parseFloat((Object.keys(new_obj.targets).reduce((sum, key) => sum + (new_obj.targets[key].skill_point || 0) , 0)).toFixed(1));
    localStorage.setItem("skill_point", JSON.stringify(new_obj));
    // console.log(getSkillPoint())
}

//個々の★のランプ状況 テキスト
function getLevelLampStatus(lv) {
    let num_no_play = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "NO PLAY" && c["★"] == lv).length;
    let num_clear = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "CLEAR" && c["★"] == lv).length;
    let num_full_combo = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "FULL COMBO" && c["★"] == lv).length;
    let num_total = num_clear + num_full_combo + num_no_play;
    return "All: " + num_total + "  " + " NP: " + num_no_play + "  " + " C: " + num_clear + "  "  + " FC: " + num_full_combo;
}
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
// header.json 読み込み => Googleスプレッドシートへのアクセス
$(document).ready(function () {
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
    checkLocalStorageSize();
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
            $("<td id='td_title'><a href=" + root_path["live"] + rec_music[j]["live_id"] + ">" + rec_music[j]["live_name"] + "</a></td>").appendTo(row);
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
                // $("<td id='td_lamp'><i class='gg-pen' id='edit_" + music[j]["live_id"] + "' onclick='editInfo(this.id)' " + "></i></td>").appendTo(row);
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
        //self_img
        //self_profile
        $("#prof_skill_pt").children().eq(1).text(getSkillPoint().point);
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
    let target_obj = $(this).parent().parent().next().children();
    let sortFlg = $(this).data('sort');
    $(this).data('sort', '')
    // ソート順序
    if(sortFlg === "" || sortFlg === "desc"){
        sortFlg = "asc";
        $(this).data('sort', "asc");
    }else{
        sortFlg = "desc";
        $(this).data('sort', "desc");
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
    console.log(candidates);
    if(!candidates.length){alert('該当する作品がありません'); return undefined;}
    const rnd = ~~(Math.random() * candidates.length);
    console.log(candidates[rnd] + " " + candidates[rnd]["★"] + ":" + level);
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


//Aboutページ遷移
$(document).on('click','#nav_about',function(){
    makeAbout();
    console.log("show: about");
});
//難易度表ページ遷移
$(document).on('click','#nav_charts',function(){
    makeTable();
    console.log("show: charts");
});
//段位認定ページ遷移
$(document).on('click','#nav_dani',function(){
    makeDaniTable();
    console.log("show: dani");
});
//Statsページ遷移
$(document).on('click','#nav_stats',function(){
    makeStats();
    console.log("show: stats");
});
//Settingページ遷移
$(document).on('click','#nav_setting',function(){
    makeSetting();
    console.log("show: setting");
});

function makeAbout(){
    let obj = $("#app");
    obj.html(""); // 初期化
    $("#panel").css("visibility", "hidden");
    $("#panel").html("");
    obj.load("./tmp/AboutPage.html", function (){
    });
}
function makeDaniTable(){
    // 現シーズンの段位認定 dani_info["season_" + header_info["season"].slice(-1)[0]]
    let obj = $("#app");
    obj.html(""); // 初期化
    $("#panel").css("visibility", "hidden");
    $("#panel").html("");
    obj.load("./tmp/daniTable.html", function (){
    });

}

function makeSetting(){
    let obj = $("#app");
    obj.html(""); // 初期化
    $("#panel").css("visibility", "hidden");
}




//雑多
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
