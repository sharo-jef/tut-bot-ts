"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
exports.__esModule = true;
var fs = require("fs");
var axios_1 = require("axios");
var express = require("express");
var line = require("@line/bot-sdk");
var log4js = require("log4js");
var richmenu_1 = require("./richmenu");
var logger = log4js.getLogger('Line');
logger.level = (_a = process.env.LOG_LEVEL) !== null && _a !== void 0 ? _a : 'all';
var Line = /** @class */ (function () {
    function Line(port, config) {
        var _this = this;
        this.listeners = [];
        this.client = new line.Client(config);
        this.app = express();
        var listener = this.app.listen(port, function () { var _a; return logger.info("listening on port " + ((_a = listener === null || listener === void 0 ? void 0 : listener.address()) === null || _a === void 0 ? void 0 : _a.port)); });
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.text());
        this.app.use('/settings', express.static('settings'));
        this.app.get('/', function (_, res) { return res.status(200).end(); });
        this.app.post('/hook', line.middleware(config), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var messages, _i, _a, listener_1, _b, messages_1, message, _c, _d, listener_2;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        res.status(200).end();
                        messages = req.body.events.map(this._convertToGeneral);
                        _i = 0, _a = this.listeners.filter(function (listener) { return listener.type === 'message'; });
                        _e.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        listener_1 = _a[_i];
                        _b = 0, messages_1 = messages;
                        _e.label = 2;
                    case 2:
                        if (!(_b < messages_1.length)) return [3 /*break*/, 5];
                        message = messages_1[_b];
                        return [4 /*yield*/, listener_1.listener(message)["catch"](function (error) { return logger.error(error); })];
                    case 3:
                        _e.sent();
                        _e.label = 4;
                    case 4:
                        _b++;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        _c = 0, _d = this.listeners.filter(function (listener) { return listener.type === 'messages'; });
                        _e.label = 7;
                    case 7:
                        if (!(_c < _d.length)) return [3 /*break*/, 10];
                        listener_2 = _d[_c];
                        return [4 /*yield*/, listener_2.listener(messages)["catch"](function (error) { return logger.error(error); })];
                    case 8:
                        _e.sent();
                        _e.label = 9;
                    case 9:
                        _c++;
                        return [3 /*break*/, 7];
                    case 10: return [2 /*return*/];
                }
            });
        }); });
        this.app.post('/push', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                res.status(200).end();
                request = JSON.parse(req.body);
                this.send(request);
                return [2 /*return*/];
            });
        }); });
        this.app.get('/api/v1/settings/:id', function (req, res) {
            axios_1["default"].get("https://tut-php-api.herokuapp.com/api/v1/settings/" + req.params.id)
                .then(function (response) {
                res.send(JSON.stringify(response.data));
            })["catch"](function (error) {
                res.status(500).end();
                logger.error(error);
            });
        });
        this.app.post('/api/v1/settings/:id', function (req, res) {
            res.status(200).end();
            axios_1["default"].post("https://tut-php-api.herokuapp.com/api/v1/settings/" + req.params.id, req.body)["catch"](function (error) { return logger.error(error); });
        });
        // ! DEBUG
        this.app.get('/debug', function (req, res) {
            res.send(req.body);
        });
        this.client.createRichMenu(richmenu_1["default"])
            .then(function (menuId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.debug('generated richmenu:', menuId);
                        return [4 /*yield*/, this.client.setRichMenuImage(menuId, fs.createReadStream(process.env.ROOT + "/img/menu1.png"))["catch"](function (error) { return logger.error(error); })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.client.setDefaultRichMenu(menuId)["catch"](function (error) { return logger.error(error); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })["catch"](function (error) { return logger.error(error); });
    }
    Line.prototype.send = function (messages) {
        return __awaiter(this, void 0, void 0, function () {
            var lineMessages, _i, lineMessages_1, message, MAX_RECIPIENTS, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lineMessages = [];
                        messages.map(this._convertToLine).forEach(function (message) {
                            if (!message) {
                                return;
                            }
                            if (message.message.type === 'text') {
                                lineMessages.push(message);
                            }
                            else if (message.message.type === 'template' && message.message.template.type === 'carousel') {
                                var MAX_COLUMNS = 10;
                                for (var i = 0; i < message.message.template.columns.length; i += MAX_COLUMNS) {
                                    var tempMessage = JSON.parse(JSON.stringify(message));
                                    tempMessage.message.template.columns = tempMessage.message.template.columns.slice(i, i + MAX_COLUMNS);
                                    lineMessages.push(tempMessage);
                                }
                            }
                        });
                        _i = 0, lineMessages_1 = lineMessages;
                        _a.label = 1;
                    case 1:
                        if (!(_i < lineMessages_1.length)) return [3 /*break*/, 6];
                        message = lineMessages_1[_i];
                        MAX_RECIPIENTS = 500;
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < message.to.length)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.client.multicast(message.to.slice(i, i + MAX_RECIPIENTS), message.message)["catch"](function (error) { return logger.fatal(error); })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        i += MAX_RECIPIENTS;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Line.prototype.on = function (event, listener) {
        this.listeners.push({ type: event, listener: listener });
        return this;
    };
    /**
     * convert general message object into line message object
     */
    Line.prototype._convertToLine = function (message) {
        var _a, _b, _c;
        var tmp;
        switch (message.type) {
            case 'text':
                tmp = {
                    to: message.to,
                    message: {
                        type: 'text',
                        text: message.text
                    }
                };
                if (message.quickReply
                    && ((_a = message.quickReply) === null || _a === void 0 ? void 0 : _a.texts)
                    && ((_c = (_b = message.quickReply) === null || _b === void 0 ? void 0 : _b.texts) === null || _c === void 0 ? void 0 : _c.length)) {
                    tmp.message.quickReply = {
                        items: message.quickReply.texts.map(function (text) { return ({
                            type: 'action',
                            action: {
                                type: 'message',
                                label: text,
                                text: text
                            }
                        }); })
                    };
                }
                return tmp;
            case 'multiple':
                return {
                    to: message.to,
                    message: {
                        type: 'template',
                        altText: message.altText,
                        template: {
                            type: 'carousel',
                            columns: message.contents.map(function (content) { return ({
                                title: content.title,
                                text: content.content,
                                defaultAction: {
                                    type: 'uri',
                                    label: content.label,
                                    uri: content.uri
                                },
                                actions: [
                                    {
                                        type: 'uri',
                                        label: content.label,
                                        uri: content.uri,
                                        altUri: {
                                            desktop: content.uri
                                        }
                                    },
                                ]
                            }); })
                        }
                    }
                };
        }
    };
    /**
     * convert line message object into general message object
     */
    Line.prototype._convertToGeneral = function (message) {
        if (message.type === 'message') {
            if (message.message.type === 'text') {
                if (message.source.userId) {
                    return {
                        to: [message.source.userId],
                        type: 'text',
                        text: message.message.text
                    };
                }
            }
            return void 0;
        }
        else if (message.type === 'follow') {
            if (message.source.userId) {
                return {
                    to: [message.source.userId],
                    type: 'follow'
                };
            }
        }
    };
    return Line;
}());
exports["default"] = Line;
