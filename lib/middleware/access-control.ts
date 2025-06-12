import type { MiddlewareHandler } from 'hono';
import { config } from '@/config';
import md5 from '@/utils/md5';
import RejectError from '@/errors/types/reject';
import logger from '@/utils/logger';

const reject = (requestPath) => {
    throw new RejectError(`Authentication failed. Access denied.\n${requestPath}`);
};

const middleware: MiddlewareHandler = async (ctx, next) => {
    const requestPath = new URL(ctx.req.url).pathname;
    const accessKey = ctx.req.query('key');
    const accessCode = ctx.req.query('code');

    if (requestPath === '/' || requestPath === '/robots.txt' || requestPath === '/favicon.ico' || requestPath === '/logo.png') {
        await next();
    } else {
        if (config.accessKey && !(config.accessKey === accessKey || accessCode === md5(requestPath + config.accessKey))) {
            return reject(requestPath);
        }
        logger.info(`访问信息: ${requestPath}  ${accessCode}`);
        await next();
    }
};

export default middleware;
