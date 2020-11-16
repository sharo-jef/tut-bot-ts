/**
 * general message object
 */
export interface Message {
    to: string[];
    type: string;
}

/**
 * general text message object
 */
export interface TextMessage extends Message {
    type: 'text';
    text: string;
    quickReply?: QuickReply;
}

/**
 * general multiple message object
 */
export interface MultipleMessage extends Message {
    type: 'multiple';
    altText: string;
    contents: Content[];
}

/**
 * general follow message object
 */
export interface FollowMessage extends Message {
    type: 'follow';
}

/**
 * general quick reply object
 */
export interface QuickReply {
    texts: string[];
}

/**
 * general content object
 */
export interface Content {
    title?: string;
    content: string;
    uri?: string;
    label?: string;
}
