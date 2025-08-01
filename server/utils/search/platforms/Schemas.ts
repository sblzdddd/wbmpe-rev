export type NeteaseSearchResponse = {
  result: {
    songs: {
      id: number;
      name: string;
      artists: {
        id: number;
        name: string;
        picUrl: null;
        alias: unknown[];
        albumSize: number;
        picId: number;
        fansGroup: null;
        img1v1Url: string;
        img1v1: number;
        trans: null;
      }[];
      album: {
        id: number;
        name: string;
        artist: {
          id: number;
          name: string;
          picUrl: null;
          alias: unknown[];
          albumSize: number;
          picId: number;
          fansGroup: null;
          img1v1Url: string;
          img1v1: number;
          trans: null;
        };
        publishTime: number;
        size: number;
        copyrightId: number;
        status: number;
        picId: number;
        mark: number;
      };
      duration: number;
      copyrightId: number;
      status: number;
      alias: unknown[];
      rtype: number;
      ftype: number;
      transNames: [] | [string];
      mvid: number;
      fee: number;
      rUrl: null;
      mark: number;
    }[];
    songCount: number;
  };
  code: number;
};

export type QQSearchResponse = {
  code:    number;
  data:    {
    keyword:   string;
    song: {
      curnum:   number;
      curpage:  number;
      list:     {
        albumid:           number;
        albummid:          string;
        albumname:         string;
        albumname_hilight: string;
        alertid:           number;
        belongCD:          number;
        cdIdx:             number;
        chinesesinger:     number;
        docid:             string;
        grp:               {
          albumid:           number;
          albummid:          string;
          albumname:         string;
          albumname_hilight: string;
          alertid:           number;
          belongCD:          number;
          cdIdx:             number;
          chinesesinger:     number;
          docid:             string;
          format:            string;
          interval:          number;
          isonly:            number;
          lyric:             string;
          lyric_hilight:     string;
          media_mid:         string;
          msgid:             number;
          newStatus:         number;
          nt:                number;
          pay:               QQPay;
          pubtime:           number;
          pure:              number;
          singer:            QQSinger[];
          size128:           number;
          size320:           number;
          sizeape:           number;
          sizeflac:          number;
          sizeogg:           number;
          songid:            number;
          songmid:           string;
          songname:          string;
          songname_hilight:  string;
          songurl:           string;
          strMediaMid:       string;
          stream:            number;
          switch:            number;
          t:                 number;
          tag:               number;
          type:              number;
          ver:               number;
          vid:               string;
        }[];
        interval:          number;
        isonly:            number;
        lyric:             string;
        lyric_hilight:     string;
        media_mid:         string;
        msgid:             number;
        newStatus:         number;
        nt:                number;
        pay:               QQPay;
        pubtime:           number;
        pure:              number;
        singer:            QQSinger[];
        size128:           number;
        size320:           number;
        sizeape:           number;
        sizeflac:          number;
        sizeogg:           number;
        songid:            number;
        songmid:           string;
        songname:          string;
        songname_hilight:  string;
        strMediaMid:       string;
        stream:            number;
        switch:            number;
        t:                 number;
        tag:               number;
        type:              number;
        ver:               number;
        vid:               string;
      }[];
      totalnum: number;
    }
  };
  message: string;
  notice:  string;
  subcode: number;
  time:    number;
  tips:    string;
}
export type QQPay = {
  payalbum:      number;
  payalbumprice: number;
  paydownload:   number;
  payinfo:       number;
  payplay:       number;
  paytrackmouth: number;
  paytrackprice: number;
}
export type QQSinger = {
  id:           number;
  mid:          string;
  name:         string;
  name_hilight: string;
}
