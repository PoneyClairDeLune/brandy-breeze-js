// Encode and decode streams

"use strict";

import {
	emitSingleByte
} from "../common/utils.mjs";

const encodeWindow = 255; // Cannot be higher than 255

let RLEEncoder = class {
	#length = 4; // Default for Bzip2
	get length() {
		return this.#length;
	};
	constructor(length = 4) {
		if (length > 255 || length < 1) {
			throw(new RangeError(`Invalid length`))
		};
		this.#length = length;
	};
	encode(source) {
		let length = this.#length;
		let maxWindow = encodeWindow + length; // This value shouldn't exceed 255 on strongly-typed implementations
		let reader = source.getReader();
		let newController, newStream = new ReadableStream({
			start: (controller) => {
				newController = controller;
			}
		});
		(async () => {
			let undone = true;
			let lastByte = 0, sameCount = 0;
			let totalOffset = 0;
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
						if (lastByte == e) {
							sameCount ++;
							if (sameCount <= length) {
								//console.error(`Emit source byte: ${e} [${totalOffset}]`);
								newController.enqueue(emitSingleByte(e));
							} else if (sameCount < maxWindow) {
								//console.error(`Same byte count: ${e} (${sameCount - length}, ${sameCount}) [${totalOffset}]`);
							} else {
								//console.error(`Emit count byte: ${sameCount - length} [${totalOffset}]`);
								newController.enqueue(emitSingleByte(sameCount - length));
								//console.error(`Emit source byte: ${e} [${totalOffset}]`);
								//console.error(`Force reset count for byte: ${e} [${totalOffset}]`);
								sameCount = 0;
							};
						} else {
							if (sameCount >= length) {
								//console.error(`Emit count byte: ${sameCount - length} [${totalOffset}]`);
								newController.enqueue(emitSingleByte(sameCount - length));
							};
							//console.error(`Reset count for byte: ${e} [${totalOffset}]`);
							lastByte = e;
							sameCount = 1;
							//console.error(`Emit source byte: ${e} [${totalOffset}]`);
							newController.enqueue(emitSingleByte(e));
						};
						totalOffset ++;
					};
				};
				if (sameCount >= length) {
					//console.error(`Emit count byte: ${sameCount - length}`);
					newController.enqueue(emitSingleByte(sameCount - length));
				};
			};
			// Release the lock and close the stream when done
			newController.close();
			reader.releaseLock();
		})();
		return newStream;
	};
};
let RLEDecoder = class {
	#length = 4; // Default for Bzip2
	get length() {
		return this.#length;
	};
	constructor(length = 4) {
		if (length > 255 || length < 1) {
			throw(new RangeError(`Invalid length`))
		};
		this.#length = length;
	};
	decode(source) {};
};

export {
	RLEEncoder,
	RLEDecoder
}
