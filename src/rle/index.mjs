// Deno CLI interface

"use strict";

import {
	RLEEncoder,
	RLEDecoder
} from "./stream.mjs";

console.error("RLE Codec Util\n");

switch (Deno.args[0]) {
	case "help": {
		console.info("c <length> <file>    Encode file in RLE.\nd <length> <file>    Decode file from RLE.\n\nThe length value must be the exact same!");
		break;
	};
	case "c": {
		// Compress or encode
		let length = parseInt(Deno.args[1]);
		let fsFile = await Deno.open(Deno.args[2], {read: true, create: false});
		let encoder = new RLEEncoder(length);
		let fsTarget = await Deno.open(`${Deno.args[2]}.rle`, {read: true, write: true, createNew: true});
		let rleStream = encoder.encode(fsFile.readable);
		await rleStream.pipeTo(fsTarget.writable);
		break;
	};
	case "d": {
		// Decompress or decode
		let length = parseInt(Deno.args[1]);
		let fsFile = await Deno.open(Deno.args[2], {read: true, create: false});
		let decoder = new RLEDecoder(length);
		let fsTarget = await Deno.open(`${Deno.args[2]}.bak`, {read: true, write: true, createNew: true});
		let rleStream = decoder.decode(fsFile.readable);
		await rleStream.pipeTo(fsTarget.writable);
		break;
	};
	default: {
		console.error(`Invalid arguments.`);
	};
};
