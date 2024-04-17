"use strict";

import {
	emitSingleByte
} from "../common/utils.mjs";

// A somewhat "optimized" dictionary for use with ASCII, and perhaps also UTF-8.
const mtfDict = new Uint8Array(256), mtfiDict = new Uint8Array(256);
let highOrder = [6, 7, 4, 5, 3, 2, 0, 1, 14, 15, 12, 13, 10, 11, 8, 9];
for (let i = 0; i < mtfDict.length; i ++) {
	let e = (highOrder[i >> 4] << 4) | (i & 15);
	mtfDict[i] = e;
	mtfiDict[e] = i;
};

let ptrMtf = function (dictIBuf, byte) {
	// Cannot use the faster algorithm due to having an optimized dictionary
	/* for (let i = 0; i < byte; i ++) {
		dictIBuf[i] ++;
	}; */
	let targetPos = dictIBuf[byte];
	for (let i = 0; i < dictIBuf.length; i ++) {
		if (dictIBuf[i] < targetPos) {
			dictIBuf[i] ++;
		};
	};
	dictIBuf[byte] = 0;
};
let valMtf = function (dictBuf, byte) {
	let curPos = dictBuf.indexOf(byte);
	if (curPos) {
		console.error(`Current position: ${curPos}`);
		dictBuf.set(dictBuf.subarray(0, curPos), 1);
		dictBuf[0] = byte;
	};
	//console.error(dictBuf.subarray(0, 32).toString());
};

let MTFEncoder = class {
	encode(source) {
		let reader = source.getReader();
		let newController, newStream = new ReadableStream({
			start: (controller) => {
				newController = controller;
			}
		});
		(async () => {
			let undone = true;
			let streamIDict = new Uint8Array(256);
			streamIDict.set(mtfiDict);
			while (undone) {
				let {done, value} = await reader.read();
				undone = !done;
				if (value == null || value == undefined) {
					continue;
				};
				if (value.constructor != Uint8Array && value.constructor != Uint8ClampedArray) {
					throw(new Error("Invalid input source"));
				};
				if (undone) {
					for (let i = 0; i < value.length; i ++) {
						let e = value[i];
						//console.debug(streamDict.subarray(64, 128).toString());
						//console.debug(`Encode byte at index: ${e}, ${streamDict[e]}`);
						//let real = streamDict.indexOf(e);
						//console.debug(`Expected: ${streamIDict[e]}, Real: ${real}`);
						newController.enqueue(emitSingleByte(streamIDict[e]));
						ptrMtf(streamIDict, e);
						//valMtf(streamDict, e);
					};
				};
			};
			newController.close();
			reader.releaseLock();
		})();
		return newStream;
	};
};
let MTFDecoder = class {
	decode(source) {
		let reader = source.getReader();
		let newController, newStream = new ReadableStream({
			start: (controller) => {
				newController = controller;
			}
		});
		(async () => {
			let undone = true;
			let streamDict = new Uint8Array(256);
			streamDict.set(mtfDict);
			while (undone) {
				let {done, value} = await reader.read();
				undone = !done;
				if (value == null || value == undefined) {
					continue;
				};
				if (value.constructor != Uint8Array && value.constructor != Uint8ClampedArray) {
					throw(new Error("Invalid input source"));
				};
				if (undone) {
					for (let i = 0; i < value.length; i ++) {
						let e = value[i];
						let byte = streamDict[e];
						//console.debug(`Decode byte at index: ${byte}, ${e}`);
						newController.enqueue(emitSingleByte(byte));
						valMtf(streamDict, byte);
					};
				};
			};
			newController.close();
			reader.releaseLock();
		})();
		return newStream;
	};
};

export {
	MTFEncoder,
	MTFDecoder
};
