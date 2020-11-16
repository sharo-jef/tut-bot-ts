import axios from 'axios';
import * as log4js from 'log4js';

import Line from './line';

const logger = log4js.getLogger();
logger.level = process.env.LOG_LEVEL ?? 'all';

const client = new Line(process.env.PORT ?? 8888, {
    channelAccessToken: process.env.TOKEN ?? '',
    channelSecret: process.env.SECRET ?? '',
});

client.on('messages', async messages => {
    const response = await axios.post(`${process.env.BACKEND_SERVER_URI_BASE}/messages/reply`, messages)
        .catch(error => logger.error(error));
    if (!response) {
        return;
    }
    client.send(response.data)
        .catch(error => logger.error(error));
});
