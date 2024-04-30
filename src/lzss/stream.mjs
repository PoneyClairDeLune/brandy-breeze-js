"use strict";

let LZSSEncoder = class {
	encode(source) {
		let reader = source.getReader();
		let newController, newStream = new ReadableStream({
			start: (controller) => {
				newController = controller;
			}
		});
		(async () => {
			let undone = true;
			let u8Buf;
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

				};
			};
			newController.close();
			reader.releaseLock();
		})();
		return newStream;
	};
};
let LZSSDecoder = class {
	decode(source) {
		let reader = source.getReader();
		let newController, newStream = new ReadableStream({
			start: (controller) => {
				newController = controller;
			}
		});
		(async () => {
			let undone = true;
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

				};
			};
			newController.close();
			reader.releaseLock();
		})();
		return newStream;
	};
};
