"use strict";

let emitSingleByte = (byte) => {
	let buffer = new Uint8Array(1);
	buffer[0] = byte;
	return buffer;
};

export {
	emitSingleByte
};
