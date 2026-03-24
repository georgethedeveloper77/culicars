"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeVin = exports.isValidVin = exports.validateVin = void 0;
exports.validateAndDecode = validateAndDecode;
// apps/api/src/services/vinDecoder.ts
const utils_1 = require("@culicars/utils");
function validateAndDecode(input) {
    const validation = (0, utils_1.validateVin)(input);
    if (!validation.valid) {
        return { valid: false, vin: validation.vin, errors: validation.errors, decode: null };
    }
    const decode = (0, utils_1.decodeVin)(validation.vin);
    return { valid: true, vin: validation.vin, errors: [], decode };
}
var utils_2 = require("@culicars/utils");
Object.defineProperty(exports, "validateVin", { enumerable: true, get: function () { return utils_2.validateVin; } });
Object.defineProperty(exports, "isValidVin", { enumerable: true, get: function () { return utils_2.isValidVin; } });
Object.defineProperty(exports, "decodeVin", { enumerable: true, get: function () { return utils_2.decodeVin; } });
