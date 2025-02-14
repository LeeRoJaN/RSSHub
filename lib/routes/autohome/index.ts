import InvalidParameterError from '@/errors/types/invalid-parameter';
import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';
import iconv from 'iconv-lite';
import { parseDate } from '@/utils/parse-date';
import timezone from '@/utils/timezone';

// import dayjs from 'dayjs';

// import timezone from 'dayjs/plugin/timezone';
// import utc from 'dayjs/plugin/utc';

// dayjs.extend(utc)
// dayjs.extend(timezone)

const get_url = (channel) => `https://www.autohome.com.cn/${channel}/`;

const config = {
    news: {
        title: '全部',
    },
    all: {
        title: '车闻',
    },
    advice: {
        title: '导购',
    },
    drive: {
        title: '试驾评测',
    },
    use: {
        title: '用车',
    },
    culture: {
        title: '文化',
    },
    travels: {
        title: '游记',
    },
    tech: {
        title: '技术',
    },
    tuning: {
        title: '改装赛事',
    },
    ev: {
        title: '新能源',
    },
};

export const route: Route = {
    path: '/:channel?',
    categories: ['new-media'],
    example: '/autohome/all',
    parameters: { channel: '频道' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '汽车之家',
    maintainers: ['test668'],
    handler,
    description: `| all      | news     | advice      | drive     | use      | culture      | travels      | tech     | tuning     |ev     |
  | ------- | -------- | ---------- | ---------- | ----------- | --------- | ------------ | -------- | -------- | -------- |
  | 全部 | 车闻 | 导购 | 试驾评测 | 用车 | 文化 | 游记 | 技术 | 改装赛事 | 新能源 |`,
};

async function handler(ctx) {
    const channel = ctx.req.param('channel') ? ctx.req.param('channel') : 'all';
 
    const current_url = get_url(channel);

    const response = await got({
        method: 'get',
        responseType: 'buffer',
        url: current_url
    });


    const $ = load(iconv.decode(response.data, 'gbk'));

    const list = $('#auto-channel-lazyload-article > ul > li > a')
        .slice(0, 10)
        .map((_, item) => {
            item = $(item);
            const t1 = item.find('h3').text();
            
            return {
                title: t1 != '' ? t1 : item.find('p.article-content').text(),
                link: 'https:' + item.attr('href'),
            };
        })
        .get();


    const items = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const res = await got({ method: 'get', responseType: 'buffer', url: item.link });
                const content = load(iconv.decode(res.data, 'gbk'));

                const post = content('#articleContent');
                post.find('img').each((_, ele) => {
                    ele = $(ele);
                    let title = $('#articlewrap').find('h1').text();
                    if(title != ''){
                        ele.attr('src', ele.attr('data-src'));
                        ele.removeAttr('data-src');
                    }
                });
                item.description = post.html();

                const time = content('.article-info > .time').text().trim();
                const formatTime = time.replace(/(\d{4})年(\d{2})月(\d{2})日/, '$1-$2-$3')
                // item.pubDate = dayjs(formatTime).tz("Asia/Shanghai").format('YYYY-MM-DD HH:mm')
                item.pubDate = timezone(parseDate(formatTime,'YYYY-MM-DD HH:mm'), +8);

                return item;
            })
        )
    );
    ctx.set('json', items)

    return {
        title: config[channel].title + ' - 汽车之家',
        link: current_url,
        image: 'https://s2.loli.net/2024/10/17/rsQCpPJ6Oe1qcK7.png',
        item: items,
    };
}
