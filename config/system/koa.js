import Koa from 'koa';
import KoaRouter from 'koa-router';
import koaBody from 'koa-bodyparser';
import json from 'koa-json';
import fs from 'fs';

import loggerUtil from './../../utils/logger';

const logger = loggerUtil.getInstance();

let walk;

function loadRoutes(router, callback) {
    // Load URLs
    const routesPath = `${__dirname}/../../routes`;
    walk = (path) => {
        let newPath = '';
        fs.readdirSync(path).forEach((file) => {
            newPath = `${path}/${file}`;
            const stat = fs.statSync(newPath);
            if (stat.isFile()) {
                if (/(.*)\.(js$|coffee$)/.test(file)) {
                    const route = require(newPath); // eslint-disable-line
                    route.default.setRoutes(router);
                }
            } else if (stat.isDirectory() && file !== 'middlewares') {
                walk(newPath);
            }
        });
    };
    walk(routesPath);

    if (callback) callback(router);
}

function init() {
    const app = new Koa();
    const router = new KoaRouter();

	app.use(koaBody());
    app.use(json());

    loadRoutes(router, (attachedRouter) => {
        app.use(attachedRouter.routes());
        app.use(attachedRouter.allowedMethods());
        app.listen(process.env.PORT, () => {
            logger.info('%s listening at %s', process.env.APP_NAME, process.env.PORT);
            
        });
    });
}






export default init;