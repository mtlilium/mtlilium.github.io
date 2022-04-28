#-*- coding:utf-8 -*-
from collections import defaultdict
import json
import urllib.request as req
import pandas as pd
import math
category_dict = {0: '其他', 1: 'EASY', 2: 'NORMAL', 3: 'HARD', 4: 'EXTREME', 5: 'TECHNICAL', 6: 'ULTIMATE'}
map_dict = defaultdict(list)
num_category = 7
step = 24

# https://m.tianyi9.com/API/getlivelist?type=category&offset=24&limit=24&uid=11592&category=4
root_url = 'https://m.tianyi9.com/API/getlivelist?type=category'

def cal_offset(offset, category):
    return root_url + '&offset=' + str(offset) + '&category=' + str(category)

def main():
    for cat in range(num_category):
        print(category_dict[cat] + ":")
        data_size = json.loads(req.urlopen(cal_offset(0, cat)).read().decode())['content']['count']
        print(data_size)
        for j in range(math.ceil(data_size/step)):
            data = json.loads(req.urlopen(cal_offset(step*j, cat)).read().decode())
            map_dict[category_dict[cat]].extend(data['content']['items'])
            print(j, len(map_dict[category_dict[cat]]))

        df = pd.json_normalize(map_dict[category_dict[cat]])
        df.set_index('live_id', inplace=True)
        df.rename({'upload_user.username':'author'}, axis=1, inplace=True)
        df.drop(['click_count','memberonly'],axis=1,inplace=True)
        df.to_csv('./maplist/' + category_dict[cat] + '.csv', encoding='utf-8_sig')

if __name__ == "__main__":

    main()
