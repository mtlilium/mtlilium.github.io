// 定数
const root_path = {live:"https://m.tianyi9.com/#/getlive?live_id=", upload:"https://m.tianyi9.com/upload/", user:"https://m.tianyi9.com/#/userInfo?uid=", user_info:"https://m.tianyi9.com/API/user_info?uid="};
const lamp_colors = {"NO PLAY": "#dddddde6", "CLEAR": "#ccffcce6", "FULL COMBO": "#ffffcce6"}; // クリアランプの色
const dani_rank = ["初段", "二段", "三段", "四段", "五段", "六段", "七段", "八段", "九段", "十段", "中伝", "皆伝"];
let header_info; // header.json の情報
let chart_info; // ALL
let insane_chart_info; // 発狂難易度表入り譜面
let dani_info;
let max_score = 1000000;
let min_score = 0;
const initial_regex_pt = {"A.B.C.D" : /^[A-Da-d]/, "E.F.G.H" :  /^[E-He-h]/, "I.J.K.L" : /^[I-Li-l]/, "M.N.O.P" :  /^[M-Pm-p]/, "Q.R.S.T" : /^[Q-Tq-t]/, "U.V.W.X.Y.Z" : /^[U-Zu-z]/, "OTHERS" : /^([^A-Za-z])/};
const initial_regax = ["A.B.C.D", "E.F.G.H", "I.J.K.L", "M.N.O.P", "Q.R.S.T", "U.V.W.X.Y.Z", "OTHERS"]
const num_recommend = 10;
function isNumber(numVal){
    // チェック条件パターン
    const pattern = RegExp(/^([1-9]\d*|0)$/);
    // 数値チェック
    return pattern.test(numVal);
}

// セーブデータ
//1. key : live_id, value : {"score": 990125, "lamp": "NO PLAY" or "CLEAR" or "FULL COMBO", "fav": true or false}
//2. key : "user_info", value : {"user_id": 11012, "avatar_path": "url", "max_dani": "三段"}
//3. key : "insane_dani" + season_num, value : {"1":{"score":[1,2,3,4], rate:95, status:"CLEAR" or "EX_CLEAR" or "FAILED"}, ... , "12":{"score":[1,2,3,4], rate:95, status:"CLEAR" or "EX_CLEAR" or "FAILED"}}


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

//個々の★のランプ状況 テキスト
function getLevelLampStatus(lv) {
    let num_no_play = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "NO PLAY" && c["★"] == lv).length;
    let num_clear = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "CLEAR" && c["★"] == lv).length;
    let num_full_combo = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "FULL COMBO" && c["★"] == lv).length;
    let num_total = num_clear + num_full_combo + num_no_play;
    return "All: " + num_total + "  " + " NP: " + num_no_play + "  " + " C: " + num_clear + "  "  + " FC: " + num_full_combo;
}
// insa
function getTodayRecommend(num){
    let dt = new Date();
    let y = dt.getFullYear();
    let m = dt.getMonth() + 1;
    m = ( ( m < 10 ) ? '0' : '' ) + m;
    let d = dt.getDate();
    d = ( ( d < 10 ) ? '0' : '' ) + d;
    //. 今日の午前零時のタイムスタンプをシードとして取得
    dt = new Date( y + '-' + m + '-' + d + ' 00:00:00' );
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
            console.log(chart);
            console.log(header);
            header_info = header;
            chart_info = chart;
            insane_chart_info = chart_info.filter(c => c["★"] !== ""); // // 発狂難易度表入り譜面のみをフィルタで取得
            makeTable(insane_chart_info, header_info["symbol"]);
        });
    });
    $.getJSON($("meta[name=dani_data]").attr("content"), function (dani) {
        dani_info = dani;
    });

});

// スクロールすると丈夫に固定されるナビゲーション
$(document).ready(function () {
    let navBar = $("#navBar");
    $(window).scroll(function (){
        if($(this).scrollTop() >= $("#lampStatus").offset().top){
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
    // header.json に書かれている level_order から順番に生成
    let symbol = header_info["symbol"];
    for(let i = 0; i < header_info["level_order"].length; ++i){
        let lv = header_info["level_order"][i];
        let music = chart_info.filter(c => c["★"] == lv);
        // 該当する譜面が存在すればアコーディオンリスト 1 つ生成
        if(music.length){
            console.log(lv + ":" + music.length + "譜面")
            console.log(music)
            // アコーディオン部
            $("#default_folder").append("<div class='ac2_one'" + "id=lv" + lv + "><div class='ac2_header'><div class='items_header'><div class='symbol_header'>" + symbol + lv + "</div>" +
                "<div class='lamp_cnt_header'>" + "Total: 00 NP: 00 C: 00 FC: 00" + "</div>" +
                "</div></div><div class='ac_inner'>");
            $("#lv" + lv).find(".ac_inner").append("<table class='box_one' id='table_int'></table>");
            // 表のヘッダ追加 ["(symbol)", "(lamp)", "(jacket)", Title, Artist, Author, Level, Score]
            $("#lv" + lv).find(".ac_inner .box_one").append("<thead class='table-dark'><tr><th id='th_symbol'>"+ symbol +"</th><th id='th_lamp'></th><th id='th_jacket'></th><th id='th_title'>Title</th><th id='th_artist'>Artist</th><th id='th_author'>Author</th><th id='th_level'>Level</th><th id='th_score'>Score</th></tr></thead><tbody>");
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
function makeCustomFolder(){
    let symbol = header_info["symbol"];
    //Favorite フォルダ
    //RECOMMEND フォルダ
    let rec_music = getTodayRecommend(num_recommend);
    if(rec_music.length){
        // アコーディオン部
        $("#custom_folder").append("<div class='ac2_one' id='recommend'><div class='ac2_header'><div class='items_header'><div class='symbol_header'>" + "RECOMMEND" + "</div>" +
            "</div></div><div class='ac_inner'></div>");
        $("#recommend").find(".ac_inner").append("<table class='box_one' id='table_int'></table>");
        // 表のヘッダ追加 ["(symbol)", "(lamp)", "(jacket)", Title, Artist, Author, Level, Score]
        $("#recommend").find(".ac_inner .box_one").append("<thead class='table-dark'><tr><th id='th_symbol'>"+ symbol +"</th><th id='th_lamp'></th><th id='th_jacket'></th><th id='th_title'>Title</th><th id='th_artist'>Artist</th><th id='th_author'>Author</th><th id='th_level'>Level</th><th id='th_score'>Score</th></tr></thead><tbody>");
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
});

//ファボ更新
$(document).on('click', '#fav_icon', function (){
    console.log("fav!!");
    console.log($(this))
    $(this).toggleClass("fas");
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

function setAccordionColor(){
    var n = $('#app').find('.ac_one .ac_header').length;
    let start_hsl = [202, 100, 50];
    let end_hsl = [360+12, 100, 50];
    for(let i = 0; i < n; ++i){
        var hsvText = "hsl("+ Math.floor(start_hsl[0] + ((end_hsl[0] - start_hsl[0])*i/n)) + ",60% , 50%)";
        $('#app .ac_one .ac_header').eq(i).css({
            'background-color': hsvText
        });
        $('#app .ac_one .ac_inner').eq(i).css({
            'border-left': "2px solid",
            'border-left-color': hsvText,
            'border-right': "2px solid",
            'border-right-color': hsvText,
            'border-bottom': "2px solid",
            'border-bottom-color': hsvText
        })
    }
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
        $("#score_box").val(getMusic_LocalData(target["live_id"])['score'])
        $("#lamp_menu").attr('class', target["live_id"]);
        $("#score_box").attr('class', target["live_id"]);
        $('#score_box').prop("disabled", getMusic_LocalData(target["live_id"])['lamp'] === 'NO PLAY');
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
}
function makeDaniTable(){
    // 現シーズンの段位認定 dani_info["season_" + header_info["season"].slice(-1)[0]]
    let obj = $("#app");
    obj.html(""); // 初期化
    $("#panel").css("visibility", "hidden");
    $("#panel").html("");
    for(let i = 0; i < dani_rank.length; ++i){
        let d = dani_info["season_" + header_info["season"].slice(-1)[0]]; // 書き方 d["初段"]
        // 該当する段位が存在すればアコーディオンリスト 1 つ生成
        if(dani_rank[i] in d){
            console.log(d[dani_rank[i]])
            // // アコーディオン部
            $("<div class='ac_one'" + "id=" + dani_rank[i] + "><div class='ac_header'>" + dani_rank[i] + "<div class='i_box'><i class='one_i'></i></div></div><div class='ac_inner'>").appendTo(obj);
            $("#" + dani_rank[i]).find(".ac_inner").append("<table class='box_one' id='table_int'></table>");
            // // 表のヘッダ追加 ["(symbol)", "(lamp)", "(jacket)", Title, Artist, Author, Level, Score]
            // $("#lv" + lv).find(".ac_inner .box_one").append("<thead class='table-dark'><tr><th id='th_symbol'>"+ symbol +"</th><th id='th_lamp'></th><th id='th_jacket'></th><th id='th_title'>Title</th><th id='th_artist'>Artist</th><th id='th_author'>Author</th><th id='th_level'>Level</th><th id='th_score'>Score</th></tr></thead><tbody>");
            // // 行追加
            // for(let j = 0; j < music.length; ++j){
            //     //localStorage["live_id"] からクリア状況データを取得
            //     let music_localData = getMusic_LocalData(music[j]["live_id"]);
            //     // music[j]["live_id"] から row を特定できるようにする
            //     let row = $("<tr id='tr_" + music[j]["live_id"] + "' ></tr>");
            //     changeBgColor(row, lamp_colors[music_localData["lamp"]]);
            //     //symbol
            //     $("<td id='td_symbol'>" + symbol + lv + "</td>").appendTo(row);
            //     //lamp
            //     // $("<td id='td_lamp'><i class='gg-pen' id='edit_" + music[j]["live_id"] + "' onclick='editInfo(this.id)' " + "></i></td>").appendTo(row);
            //     $("<td id='td_lamp'><img src='./imgs/pen.png'></td>").appendTo(row);
            //     //jacket
            //     $("<td id='td_jacket'><img src='" + root_path["upload"] + music[j]["cover_path"] + "'></td>").appendTo(row);
            //     //Title
            //     $("<td id='td_title'><a href=" + root_path["live"] + music[j]["live_id"] + ">" + music[j]["live_name"] + "</a></td>").appendTo(row);
            //     //Artist
            //     $("<td id='td_artist'>" + music[j]["artist"] + "</td>").appendTo(row);
            //     //Author
            //     $("<td id='td_author'>" + music[j]["author"] + "</td>").appendTo(row);
            //     //Level(公式難易度)
            //     $("<td id='td_level'>" + music[j]["level"] + "</td>").appendTo(row);
            //     //Score(localStorage["live_id"]で管理)
            //     if(music_localData["lamp"] === "NO PLAY"){
            //         $("<td id='td_score'>" + "NO PLAY" + "</td>").appendTo(row);
            //     }else{
            //         $("<td id='td_score'>" + music_localData["score"] + "</td>").appendTo(row);
            //     }
            //     //追加
            //     $("#lv" + lv).find(".ac_inner .box_one tbody").append(row);
            // }
        }
    }
    setAccordionColor();
}
function makeStats(){
    let obj = $("#app");
    obj.html(""); // 初期化
    $("#panel").css("visibility", "hidden");

    var a = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "FULL COMBO"); //FULL COMBO の数
    var b = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "CLEAR"); //CLEAR の数
    var c = insane_chart_info.filter(c =>getMusic_LocalData(c["live_id"])["lamp"] === "NO PLAY"); //NO PLAY の数
    console.log(a)
    console.log(a.length)
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
