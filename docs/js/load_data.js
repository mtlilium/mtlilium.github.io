// 定数
const root_path = {live:"https://m.tianyi9.com/#/getlive?live_id=", upload:"https://m.tianyi9.com/upload/", user:"https://m.tianyi9.com/#/userInfo?uid=", user_info:"https://m.tianyi9.com/API/user_info?uid="};
const lamp_colors = {"NO PLAY": "#dddddd", "CLEAR": "#ccffcc", "FULL COMBO": '#ffffcc'}; // クリアランプの色
let header_info; // header.json の情報
let chart_info; // ALL
let insane_chart_info; // 発狂難易度表入り譜面

function isNumber(numVal){
    // チェック条件パターン
    const pattern = RegExp(/^([1-9]\d*|0)$/);
    // 数値チェック
    return pattern.test(numVal);
}

// セーブデータ
//1. key : live_id, value : {"score": 990125, "lamp": "NO PLAY" or "CLEAR" or "FULL COMBO", "fav": true or false}
//2. key : "user_info", value : {"user_id": 11012, "avatar_path": "url", "max_insane_dani": "三段"}
//3. key : "insane_dani" + season_num, value : {"1":{"score":[1,2,3,4], rate:95, status:"CLEAR" or "EX_CLEAR" or "FAILED"}, ... , "12":{"score":[1,2,3,4], rate:95, status:"CLEAR" or "EX_CLEAR" or "FAILED"}}
function getMusic_LocalData(key){
    if(localStorage.getItem(key) === null) {
        console.log("なかったよ")
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

// header.json 読み込み => Googleスプレッドシートへのアクセス
$(document).ready(function () {
    $.getJSON($("meta[name=chart_data]").attr("content"), function (header) {
        $.getJSON(header.data_url, function (chart) {
            console.log(chart);
            console.log(header);
            header_info = header;
            chart_info = chart;
            insane_chart_info = chart_info.filter(c => c["★"] !== "") // // 発狂難易度表入り譜面のみをフィルタで取得
            makeTable(insane_chart_info, header_info["symbol"])
        });
    });
});


function makeTable(chart,symbol){
    var obj = $("#app");
    obj.html(""); // 初期化

    //ジャンプ用の ui を生成 TODO

    // header.json に書かれている level_order から順番に生成
    for(let i = 0; i < header_info["level_order"].length; ++i){
        var lv = header_info["level_order"][i];
        let music = chart.filter(c => c["★"] == lv);
        // 該当する譜面が存在すればアコーディオンリスト 1 つ生成
        if(music.length){
            console.log(lv + ":" + music.length + "譜面")
            console.log(music)
            // アコーディオン部
            $("<div class='ac_one'" + "id=lv" + lv + "><div class='ac_header'>" + symbol + lv + "<div class='i_box'><i class='one_i'></i></div></div><div class='ac_inner'>").appendTo(obj);
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
                $("<td id='td_jacket'><img src='" + root_path["upload"] + music[j]["cover_path"] + "'></td>").appendTo(row);
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
        }
    }
    setAccordionColor();
};

//アコーディオン開け閉め
$(document).on('click','#app .ac_one .ac_header',function(){
    //クリックされた.ac_oneの中の.ac_headerに隣接する.ac_innerが開いたり閉じたりする。
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
    changeBgColor($("#tr_" + id), lamp_colors[r]);
    $('#score_box').prop("disabled", r === 'NO PLAY');
    //scoreテキストも更新
    changeScoreText($("#tr_" + id), r, m_data['score']);
    //セーブデータ更新
    m_data['lamp'] = r;
    localStorage.setItem(id, JSON.stringify(m_data));
});

// スコア更新
$(document).on('change', '#score_box', function() {
    let v = $(this).val();
    let id = $(this).attr('class');
    let m_data = getMusic_LocalData(id);
    //整数値以外をはじく
    if(isNumber(v)){
        changeScoreText($("#tr_" + id), m_data['lamp'], v);
        m_data['score'] = v;
        localStorage.setItem(id, JSON.stringify(m_data));
    }else{
        $(this).val(m_data['score']);
    }
});

// ポップアップ閉じるボタンを押したとき
$(document).on('click','#popup_close',function(){
    $('.popup').fadeOut();
    console.log("popup close!!");
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

    $('.popup').addClass('popup_show').fadeIn();
}
