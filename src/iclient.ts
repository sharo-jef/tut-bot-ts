import { Message } from './@types/tutbot';

export default interface IClient {
    listeners: {type: string, listener: (...args: any) => Promise<void>}[];
    send(messages: Message[]): Promise<void>;
    on(event: 'message', listener: (message: Message) => Promise<void>): IClient;
    on(event: 'messages', listener: (messages: Message[]) => Promise<void>): IClient;
}
