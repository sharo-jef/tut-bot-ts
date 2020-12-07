import * as fs from 'fs';

import axios from 'axios';
import * as express from 'express';
import * as line from '@line/bot-sdk';
import * as log4js from 'log4js';

import { FollowMessage, Message, MultipleMessage, TextMessage, IClient } from './@types/tutbot';
import richmenu from './richmenu';

const logger = log4js.getLogger('Line');
logger.level = process.env.LOG_LEVEL ?? 'all';

export default class Line implements IClient {
    listeners: {type: string; listener: (...args: unknown[]) => Promise<void>;}[] = [];
    client: line.Client;
    app: express.Express;

    constructor(
        port: string | number,
        config: line.MiddlewareConfig & line.ClientConfig,
    ) {
        this.client = new line.Client(config);
        this.app = express();
        const listener = this.app.listen(
            port,
            () => logger.info(`listening on port ${listener?.address()?.port}`),
        );
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.text());
        this.app.use('/settings', express.static('settings'));
        this.app.get('/', (_req, res) => res.status(200).end());
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

        this.app.get('/api/v1/settings/:id', (req, res) => {
            axios.get(`https://tut-php-api.herokuapp.com/api/v1/settings/${req.params.id}`)
                .then(response => {
                    res.send(JSON.stringify(response.data));
                })
                .catch(error => {
                    res.status(500).end();
                    logger.error(error);
                });
        });
        this.app.post('/api/v1/settings/:id', (req, res) => {
            res.status(200).end();
            axios.post(`https://tut-php-api.herokuapp.com/api/v1/settings/${req.params.id}`, req.body)
                .catch(error => logger.error(error));
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

    async send(messages: Message[]): Promise<void> {
        const lineMessages: {to: string[], message: line.Message, replyToken?: string}[] = [];
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
                if (message.replyToken) {
                    await this.client.replyMessage(message.replyToken, message.message);
                } else {
                    await this.client.multicast(message.to.slice(i, i + MAX_RECIPIENTS), message.message)
                        .catch(error => logger.fatal(error));
                }
            }
        }
    }

    on(event: 'message', listener: (message: Message) => Promise<void>): this;
    on(event: 'messages', listener: (messages: Message[]) => Promise<void>): this;
    on(
        event: string,
        listener:
            ((message: Message) => Promise<void>)
            | ((messages: Message[]) => Promise<void>),
    ): this {
        this.listeners.push({ type: event, listener });
        return this;
    }

    /**
     * convert general message object into line message object
     */
    _convertToLine(message: Message): {to: string[], message: line.Message, replyToken?: string} | void {
        let tmp: {to: string[], message: line.Message, replyToken?: string};
        let textMessage: TextMessage;
        let multipleMessage: MultipleMessage;
        switch (message.type) {
        case 'text':
            textMessage = message as TextMessage;
            tmp = {
                to: message.to,
                message: {
                    type: 'text',
                    text: textMessage.text,
                },
            };
            if (
                textMessage.quickReply
                && textMessage.quickReply.texts
                && textMessage.quickReply.texts.length
            ) {
                tmp.message.quickReply = {
                    items: textMessage.quickReply.texts.map(text => ({
                        type: 'action',
                        action: {
                            type: 'message',
                            label: text,
                            text: text,
                        },
                    } as line.QuickReplyItem)),
                };
            }
            if (textMessage.replyToken) {
                tmp.replyToken = textMessage.replyToken;
            }
            return tmp;
        case 'multiple':
            multipleMessage = message as MultipleMessage;
            tmp = {
                to: multipleMessage.to,
                message: {
                    type: 'template',
                    altText: multipleMessage.altText,
                    template: {
                        type: 'carousel',
                        columns: multipleMessage.contents.map(content => ({
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
                replyToken: multipleMessage.replyToken,
            };
            return tmp;
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
                        text: message.message.text,
                        replyToken: message.replyToken,
                    } as TextMessage;
                }
            }
            return void 0;
        } else if (message.type === 'follow') {
            if (message.source.userId) {
                return {
                    to: [message.source.userId],
                    type: 'follow',
                } as FollowMessage;
            }
        }
    }
}
