import type { MiddlewareHandler } from 'hono';
import { config } from '@/config';
import md5 from '@/utils/md5';
import RejectError from '@/errors/types/reject';
import logger from '@/utils/logger';

const reject = () => {
    throw new RejectError('Authentication failed. Access denied.');
};

const middleware: MiddlewareHandler = async (ctx, next) => {
    const requestPath = ctx.req.path;
    const accessKey = ctx.req.query('key');
    const accessCode = ctx.req.query('code');

    if (requestPath === '/' || requestPath === '/robots.txt' || requestPath === '/favicon.ico' || requestPath === '/logo.png') {
        await next();
    } else {
        if (config.accessKey && !(config.accessKey === accessKey || accessCode === md5(requestPath + config.accessKey))) {
          
            // logger.warn(`错误信息 IP: ${ctx.req.remoteAddr}`);
            // logger.warn(`错误信息 Headers: ${ctx.req.headers}`);
            // logger.warn(`错误信息 Protocol: ${ctx.req.protocol}`);
            // logger.warn(`错误信息 Method: ${ctx.req.method}`);
            // logger.warn(`错误信息 Url: ${ctx.req.url}`);
            // logger.warn(`错误信息 Host: ${ctx.req.header('host')}`);
            
            logger.warn(`请求路径: ${ctx.req.path}`);
            logger.warn(`请求方法: ${ctx.req.method}`);
            logger.warn(`完整 URL: ${ctx.req.url}`);
            logger.warn(`查询参数: ${JSON.stringify(ctx.req.query())}`);
            logger.warn(`请求头: ${JSON.stringify(ctx.req.header())}`);
            logger.warn(`是否 HTTPS: ${ctx.req.secure}`);
            logger.warn(`客户端 IP: ${ctx.req.remoteAddr}`);
            
            logger.warn(`错误信息: ${requestPath}  ${accessCode}`);
            return reject();
        }
        logger.info(`访问信息: ${requestPath}  ${accessCode}`);
        await next();
    }
};

export default middleware;
