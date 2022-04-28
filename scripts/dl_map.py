#-*- coding:utf-8 -*-
import json
import pprint
import urllib.request
import sys
import pyperclip
import chardet
def download():

    url = sys.argv[1]
    title = sys.argv[2]
    urllib.request.urlretrieve(url,"{0}".format(title))

def download_(url, title):

    urllib.request.urlretrieve(url,"{0}".format(title))

def show(url):
    data = urllib.request.urlopen(url).read()
    guess = chardet.detect(data)
    print(guess['encoding'])
    unicode_data = data.decode(guess['encoding'])
    print(unicode_data)

def open(url):
    response = urllib.request.urlopen(url)
    print(response.info().get_content_charset())
    print('url:', response.geturl())
    print('code:', response.getcode())
    print('Content-Type:', response.info()['Content-Type'])
    content = response.read()
    print(content)
    response.close()

if __name__ == "__main__":
    url = 'https://ll.iia.pw/upload/'
    url = 'https://m.tianyi9.com/API/getlive?live_id=3EcSZ1dgZ89mK624'
    title = "settei.json"
    open("https://m.tianyi9.com/upload/lD26DGoYm11r.json")

    a = json.loads('FLOWER.json')
    print(a)
