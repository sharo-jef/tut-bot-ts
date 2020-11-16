import * as fs from 'fs';

import * as express from 'express';
import * as line from '@line/bot-sdk';
import * as log4js from 'log4js';

import { FollowMessage, Message, MultipleMessage, TextMessage } from './@types/tutbot';
import IClient from './iclient';
import richmenu from './richmenu';

const logger = log4js.getLogger('Line');
logger.level = process.env.LOG_LEVEL ?? 'all';

export default class Line implements IClient {
    listeners: {type: string; listener: (...args: any) => Promise<void>;}[] = [];
    client: line.Client;
    app: express.Express;

    constructor(
        port: string | number,
        config: line.MiddlewareConfig & line.ClientConfig
    ) {
        this.client = new line.Client(config);
        this.app = express();
        const listener = this.app.listen(
            port,
            () => logger.info(`listening on port ${listener.address().port}`)
        );
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(express.text());
        this.app.use('/settings', express.static('settings'));
        this.app.get('/', (_, res) => res.status(200).end());
        this.app.post('/hook', line.middleware(config), async (req, res) => {
            res.status(200).end();
            const messages: Message[] = req.body.events.map(this._convertToGeneral);
            for (const listener of this.listeners.filter(listener => listener.type === 'message')) {
                for (const message of messages) {
                    await listener.listener(message)
                        .catch(error => logger.error(error));
                }
            }
            for (const listener of this.listeners.filter(listener => listener.type === 'messages')) {
                await listener.listener(messages)
                    .catch(error => logger.error(error));
            }
        });
        this.app.post('/push', async (req, res) => {
            res.status(200).end();
            const request: Message[] = JSON.parse(req.body);
            this.send(request);
        });

        // ! DEBUG
        this.app.get('/debug', (req, res) => {
            res.send(req.body);
        });
        this.client.createRichMenu(richmenu)
            .then(async menuId => {
                logger.debug('generated richmenu:', menuId);
                await this.client.setRichMenuImage(menuId, fs.createReadStream(`${process.env.ROOT}/img/menu1.png`))
                    .catch(error => logger.error(error));
                await this.client.setDefaultRichMenu(menuId)
                    .catch(error => logger.error(error));
            })
            .catch(error => logger.error(error));
    }

    async send(messages: Message[]) {
        const lineMessages: {to:string[],message:import('@line/bot-sdk').Message}[] = [];
        messages.map(this._convertToLine).forEach(message => {
            if (!message) {
                return;
            }
            if (message.message.type === 'text') {
                lineMessages.push(message);
            } else if (message.message.type === 'template' && message.message.template.type === 'carousel') {
                const MAX_COLUMNS = 10;
                for (let i = 0; i < message.message.template.columns.length; i += MAX_COLUMNS) {
                    const tempMessage = JSON.parse(JSON.stringify(message));
                    tempMessage.message.template.columns = tempMessage.message.template.columns.slice(i, i + MAX_COLUMNS);
                    lineMessages.push(tempMessage);
                }
            }
        });

        for (const message of lineMessages) {
            const MAX_RECIPIENTS = 500;
            for (let i = 0; i < message.to.length; i += MAX_RECIPIENTS) {
                await this.client.multicast(message.to.slice(i, i + MAX_RECIPIENTS), message.message)
                    .catch(error => logger.fatal(error));
            }
        }
    }

    on(event: 'message', listener: (message: Message) => Promise<void>): IClient;
    on(event: 'messages', listener: (messages: Message[]) => Promise<void>): IClient;
    on(event: string, listener: (...args: any) => Promise<void>) {
        this.listeners.push({type: event, listener});
        return this;
    }

    /**
     * convert general message object into line message object
     */
    _convertToLine(message: Message): {to:string[],message:line.Message} | void {
        let tmp: {to:string[],message:line.Message};
        switch (message.type) {
        case 'text':
            tmp = {
                to: message.to,
                message: {
                    type: 'text',
                    text: (message as TextMessage).text
                },
            };
            if (
                (message as TextMessage).quickReply
                && (message as TextMessage).quickReply?.texts
                && (message as TextMessage).quickReply?.texts?.length
            ) {
                tmp.message.quickReply = {
                    items: (message as TextMessage).quickReply!.texts.map(text => ({
                            type: 'action',
                            action: {
                                type: 'message',
                                label: text,
                                text: text,
                            }
                        } as line.QuickReplyItem))
                };
            }
            return tmp;
        case 'multiple':
            return {
                to: message.to,
                message: {
                    type: 'template',
                    altText: (message as MultipleMessage).altText,
                    template: {
                        type: 'carousel',
                        columns: (message as MultipleMessage).contents.map(content => ({
                            title: content.title,
                            text: content.content,
                            defaultAction: {
                                type: 'uri',
                                label: content.label,
                                uri: content.uri,
                            },
                            actions: [
                                {
                                    type: 'uri',
                                    label: content.label,
                                    uri: content.uri,
                                    altUri: {
                                        desktop: content.uri,
                                    },
                                },
                            ],
                        } as line.TemplateColumn)),
                    },
                },
            };
        }
    }

     /**
     * convert line message object into general message object
     */
    _convertToGeneral(message: line.WebhookEvent): Message | void {
        if (message.type === 'message') {
            if (message.message.type === 'text') {
                if (message.source.userId) {
                    return {
                        to: [message.source.userId],
                        type: 'text',
                        text: message.message.text
                    } as TextMessage;
                }
            }
            return void 0;
        } else if (message.type === 'follow') {
            if (message.source.userId) {
                return {
                    to: [message.source.userId],
                    type: 'follow'
                } as FollowMessage;
            }
        }
    }
}
