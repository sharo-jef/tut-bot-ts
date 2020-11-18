import {Message} from './@types/tutbot';

export default interface IClient {
    listeners: {type: string, listener: (...args: unknown[]) => Promise<void>}[];
    send(messages: Message[]): Promise<void>;
    on(event: 'message', listener: (message: Message) => Promise<void>): this;
    on(event: 'messages', listener: (messages: Message[]) => Promise<void>): this;
    on(event: string, listener: ((message: Message) => Promise<void>) | ((messages: Message[]) => Promise<void>)): this;
}
