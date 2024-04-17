// Deno CLI interface

"use strict";

import {
	MTFEncoder,
	MTFDecoder
} from "./stream.mjs";

console.error("MTF Codec Util\n");

switch (Deno.args[0]) {
	case "help": {
		console.info("c <file>    Encode file in MTF.\nd <file>    Decode file from MTF.\n\nThe length value must be the exact same!");
		break;
	};
	case "c": {
		// Compress or encode
		let fsFile = await Deno.open(Deno.args[1], {read: true, create: false});
		let encoder = new MTFEncoder();
		let fsTarget = await Deno.open(`${Deno.args[1]}.mtf`, {read: true, write: true, createNew: true});
		let mtfStream = encoder.encode(fsFile.readable);
		await mtfStream.pipeTo(fsTarget.writable);
		break;
	};
	case "d": {
		// Decompress or decode
		let fsFile = await Deno.open(Deno.args[1], {read: true, create: false});
		let decoder = new MTFDecoder();
		let fsTarget = await Deno.open(`${Deno.args[1]}.bak`, {read: true, write: true, createNew: true});
		let mtfStream = decoder.decode(fsFile.readable);
		await mtfStream.pipeTo(fsTarget.writable);
		break;
	};
	default: {
		console.error(`Invalid arguments.`);
	};
};
