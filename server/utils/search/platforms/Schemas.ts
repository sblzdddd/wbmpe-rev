/* eslint-disable @typescript-eslint/no-explicit-any */
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

export type MikufansSearchResponse = {
  code:    number;
  message: string;
  ttl:     number;
  data:    {
    seid:                  string;
    page:                  number;
    pagesize:              number;
    next:                  number;
    numResults:            number;
    numPages:              number;
    suggest_keyword:       string;
    rqt_type:              string;
    exp_list:              { [key: string]: boolean };
    is_hit_web_inf:        boolean;
    egg_hit:               number;
    pageinfo:              any;
    top_tlist:             any;
    show_column:           number;
    show_module_list:      string[];
    app_display_option:    { is_search_page_grayed: number; };
    in_black_key:          number;
    in_white_key:          number;
    result:                Datum[];
    is_search_page_grayed: number;
  };
}

export type Datum = {
  type:                string;
  id:                  number;
  author:              string;
  mid:                 number;
  typeid:              string;
  typename:            string;
  arcurl:              string;
  aid:                 number;
  bvid:                string;
  title:               string;
  description:         string;
  pic:                 string;
  play:                number;
  video_review:        number;
  favorites:           number;
  tag:                 string;
  review:              number;
  pubdate:             number;
  senddate:            number;
  duration:            string;
  badgepay:            boolean;
  hit_columns:         string[];
  view_type:           string;
  is_pay:              number;
  is_union_video:      number;
  rec_tags:            null;
  new_rec_tags:        any[];
  like:                number;
  upic:                string;
  corner:              string;
  cover:               string;
  desc:                string;
  url:                 string;
  rec_reason:          string;
  danmaku:             number;
  biz_data:            null;
  is_charge_video:     number;
  vt:                  number;
  enable_vt:           number;
  vt_display:          string;
  subtitle:            string;
  episode_count_text:  string;
  release_status:      number;
  is_intervene:        number;
  area:                number;
  style:               number;
  cate_name:           string;
  is_live_room_inline: number;
  live_status:         number;
  live_time:           string;
  online:              number;
  rank_index:          number;
  rank_offset:         number;
  roomid:              number;
  short_id:            number;
  spread_id:           number;
  tags:                string;
  uface:               string;
  uid:                 number;
  uname:               string;
  user_cover:          string;
  parent_area_id:      number;
  parent_area_name:    string;
  watched_show:        null;
}

export type SuggestionResponse = {
  code:    number;
  data:    {
    album:  {
      count:    number;
      itemlist: {
        docid:  string;
        id:     string;
        mid:    string;
        name:   string;
        pic:    string;
        singer: string;
      }[];
      name:     string;
      order:    number;
      type:     number;
    };
    mv:     {
      count:    number;
      itemlist: {
        docid:  string;
        id:     string;
        mid:    string;
        name:   string;
        singer: string;
        vid:    string;
      }[];
      name:     string;
      order:    number;
      type:     number;
    };
    singer: {
      count:    number;
      itemlist: {
        docid:  string;
        id:     string;
        mid:    string;
        name:   string;
        singer: string;
      }[];
      name:     string;
      order:    number;
      type:     number;
    };
    song:   {
      count:    number;
      itemlist: {
        docid:  string;
        id:     string;
        mid:    string;
        name:   string;
        singer: string;
      }[];
    };
  };
  subcode: number;
}

