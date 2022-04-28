#-*- coding:utf-8 -*-
import json
import simplejson
import re
from collections import defaultdict
category_dict = {0: '其他', 1: 'EASY', 2: 'NORMAL', 3: 'HARD', 4: 'EXTREME', 5: 'TECHNICAL', 6: 'ULTIMATE'}
map_dict = defaultdict(list)
a=[]
b = [{"1":"a", "2":"b"}, {"11":"aa", "22":"bb"}]
c = [{"3":"c", "4":"d"}, {"33":"cc", "44":"dd"}]
d = [{"5":"e", "6":"f"}, {"55":"ee", "66":"ff"}, {"555":"eee", "666":"fff"}]

a.extend(b)
print(a)

a.extend(c)
print(a)

a.extend(d)
print(a)

map_dict[category_dict[0]].extend(b)
print(map_dict[category_dict[0]])
map_dict[category_dict[0]].extend(c)
print(map_dict[category_dict[0]])
map_dict[category_dict[0]].extend(d)
print(map_dict[category_dict[0]])