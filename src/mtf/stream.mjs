"use strict";

// A somewhat "optimized" dictionary for use with ASCII, and perhaps also UTF-8.
const mtfDict = new Uint8Array(256);
let highOrder = [6, 7, 4, 5, 3, 2, 0, 1, 14, 15, 12, 13, 10, 11, 8, 9];
for (let i = 0; i < mtfDict.length; i ++) {
	mtfDict[i] = (highOrder[i >> 4] << 4) | (i & 15);
};
