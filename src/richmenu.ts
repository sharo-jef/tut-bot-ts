import { RichMenu } from '@line/bot-sdk';

export default {
    size: {
        width: 2500,
        height: 843,
    },
    selected: true,
    name: 'Menu',
    chatBarText: 'メニュー',
    areas: [
        {
            bounds: {
                x: 0,
                y: 0,
                width: 833,
                height: 412,
            },
            action: {
                type: 'message',
                label: 'question',
                text: '質問',
            },
        },
        {
            bounds: {
                x: 833,
                y: 0,
                width: 833,
                height: 412,
            },
            action: {
                type: 'message',
                label: 'important',
                text: '重要情報',
            },
        },
        {
            bounds: {
                x: 1666,
                y: 0,
                width: 833,
                height: 412,
            },
            action: {
                type: 'message',
                label: 'news',
                text: '新着情報',
            },
        },
        {
            bounds: {
                x: 0,
                y: 412,
                width: 833,
                height: 412,
            },
            action: {
                type: 'message',
                label: 'canceled',
                text: '休講案内',
            },
        },
        {
            bounds: {
                x: 833,
                y: 412,
                width: 833,
                height: 412,
            },
            action: {
                type: 'message',
                label: 'events',
                text: 'イベント',
            },
        },
        {
            bounds: {
                x: 1666,
                y: 412,
                width: 833,
                height: 412,
            },
            action: {
                type: 'uri',
                label: 'settings',
                uri: 'https://liff.line.me/1655168464-glkMVdNy',
                altUri: {
                    desktop: 'https://liff.line.me/1655168464-glkMVdNy',
                },
            },
        },
    ],
} as RichMenu;
