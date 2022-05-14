#-*- coding:utf-8 -*-
from collections import defaultdict
import json
import urllib.request as req
import pandas as pd
import math

xlsx_path = "./insane_charts.xlsx"
csv_path = "./maplist/"
category_dict = {0: '其他', 1: 'EASY', 2: 'NORMAL', 3: 'HARD', 4: 'EXTREME', 5: 'TECHNICAL', 6: 'ULTIMATE'}
category_num = 7

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


if __name__ == "__main__":

    main()
