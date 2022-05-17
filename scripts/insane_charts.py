#-*- coding:utf-8 -*-
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import csv
from collections import defaultdict
import json
import urllib.request as req
import pandas as pd
import math

xlsx_path = "./insane_charts.xlsx"
csv_path = "./maplist/"
category_dict = {0: '其他', 1: 'EASY', 2: 'NORMAL', 3: 'HARD', 4: 'EXTREME', 5: 'TECHNICAL', 6: 'ULTIMATE'}
category_num = 7

# Google スプレッドシートへの参照
json_path = "./python-llp-5b5165e4e8b0.json"
spread_sheet_name = "llp_ic"
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

def make_hyperlink(value):
    url = "https://m.tianyi9.com/#/getlive?live_id={}"
    return '=HYPERLINK("%s", "%s")' % (url.format(value), value)


def main():
    xlsx_file = pd.read_excel(xlsx_path, encoding='utf-8_sig', sheet_name=0)
    print(xlsx_file)
    for i in range(0, category_num):
        csv_file = pd.read_csv(csv_path+category_dict[i]+".csv", encoding='utf-8_sig')
        csv_file = csv_file[csv_file["level"] >= 12]
        print(len(csv_file))

    # スプレッドシートにアクセス
    credentials = ServiceAccountCredentials.from_json_keyfile_name(json_path, scope)
    gc = gspread.authorize(credentials)
    sh = gc.open(spread_sheet_name)
    # wks = sh.add_worksheet(title="new worksheet", rows='100', cols='30')
    # シートの削除
    sh.del_worksheet(sh.worksheet("new worksheet"))

if __name__ == "__main__":

    main()
