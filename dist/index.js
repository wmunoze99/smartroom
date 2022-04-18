"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const index_1 = __importDefault(require("./src/routes/index"));
const webhook_1 = __importDefault(require("./src/routes/webhook"));
const fulfillment_1 = __importDefault(require("./src/routes/fulfillment"));
// Read environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, morgan_1.default)('short'));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
// App routes
app.use('/', index_1.default);
app.use('/fulfillment', fulfillment_1.default);
app.use('/webhooks', webhook_1.default);
app.listen(3000, () => {
    console.log("App running on port 3000");
});
