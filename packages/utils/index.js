"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeVin = exports.isValidVin = exports.validateVin = exports.detectInputType = exports.isValidKenyaPlate = exports.normalizePlate = void 0;
// packages/utils/index.ts
var plateNormalizer_1 = require("./plateNormalizer");
Object.defineProperty(exports, "normalizePlate", { enumerable: true, get: function () { return plateNormalizer_1.normalizePlate; } });
Object.defineProperty(exports, "isValidKenyaPlate", { enumerable: true, get: function () { return plateNormalizer_1.isValidKenyaPlate; } });
Object.defineProperty(exports, "detectInputType", { enumerable: true, get: function () { return plateNormalizer_1.detectInputType; } });
var vinValidator_1 = require("./vinValidator");
Object.defineProperty(exports, "validateVin", { enumerable: true, get: function () { return vinValidator_1.validateVin; } });
Object.defineProperty(exports, "isValidVin", { enumerable: true, get: function () { return vinValidator_1.isValidVin; } });
Object.defineProperty(exports, "decodeVin", { enumerable: true, get: function () { return vinValidator_1.decodeVin; } });
