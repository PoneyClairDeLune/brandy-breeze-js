// src/common/utils.mjs
var emitSingleByte = (byte) => {
  let buffer = new Uint8Array(1);
  buffer[0] = byte;
  return buffer;
};

// src/rle/stream.mjs
var encodeWindow = 255;
var RLEEncoder = class {
  #length = 4;
  // Default for Bzip2
  get length() {
    return this.#length;
  }
  constructor(length = 4) {
    if (length > 255 || length < 1) {
      throw new RangeError(`Invalid length`);
    }
    ;
    this.#length = length;
  }
  encode(source) {
    let length = this.#length;
    let maxWindow = encodeWindow + length;
    let reader = source.getReader();
    let newController, newStream = new ReadableStream({
      start: (controller) => {
        newController = controller;
      }
    });
    (async () => {
      let undone = true;
      let lastByte = 0, sameCount = 0;
      while (undone) {
        let { done, value } = await reader.read();
        undone = !done;
        if (value == null || value == void 0) {
          continue;
        }
        ;
        if (value.constructor != Uint8Array && value.constructor != Uint8ClampedArray) {
          throw new Error("Invalid input source");
        }
        ;
        if (undone) {
          for (let i = 0; i < value.length; i++) {
            let e = value[i];
            if (lastByte == e) {
              sameCount++;
              if (sameCount <= length) {
                newController.enqueue(emitSingleByte(e));
              } else if (sameCount < maxWindow) {
              } else {
                newController.enqueue(emitSingleByte(sameCount - length));
                sameCount = 0;
              }
              ;
            } else {
              if (sameCount >= length) {
                newController.enqueue(emitSingleByte(sameCount - length));
              }
              ;
              lastByte = e;
              sameCount = 1;
              newController.enqueue(emitSingleByte(e));
            }
            ;
          }
          ;
        }
        ;
        if (sameCount >= length) {
          newController.enqueue(emitSingleByte(sameCount - length));
        }
        ;
      }
      ;
      newController.close();
      reader.releaseLock();
    })();
    return newStream;
  }
};
var RLEDecoder = class {
  #length = 4;
  // Default for Bzip2
  get length() {
    return this.#length;
  }
  constructor(length = 4) {
    if (length > 255 || length < 1) {
      throw new RangeError(`Invalid length`);
    }
    ;
    this.#length = length;
  }
  decode(source) {
    let length = this.#length;
    let reader = source.getReader();
    let newController, newStream = new ReadableStream({
      start: (controller) => {
        newController = controller;
      }
    });
    (async () => {
      let lastByte = 0, sameCount = 0;
      let undone = true;
      let totalOffset = 0;
      while (undone) {
        let { done, value } = await reader.read();
        undone = !done;
        if (value == null || value == void 0) {
          continue;
        }
        ;
        if (value.constructor != Uint8Array && value.constructor != Uint8ClampedArray) {
          throw new Error("Invalid input source");
        }
        ;
        if (undone) {
          for (let i = 0; i < value.length; i++) {
            let e = value[i];
            if (sameCount < length) {
              newController.enqueue(emitSingleByte(e));
              if (lastByte == e) {
                sameCount++;
                console.error(`Discovered same byte with count: ${e} * ${sameCount} [${totalOffset}]`);
              } else {
                console.error(`A different byte: ${lastByte} -> ${e} [${totalOffset}]`);
                lastByte = e;
                sameCount = 1;
              }
              ;
            } else {
              console.error(`Emitting byte with length: ${lastByte} * ${e} [${totalOffset}]`);
              let u8Buf = new Uint8Array(e);
              u8Buf.fill(lastByte);
              newController.enqueue(u8Buf);
              sameCount = 0;
            }
            ;
            totalOffset++;
          }
          ;
        }
        ;
      }
      ;
      newController.close();
      reader.releaseLock();
    })();
    return newStream;
  }
};

// src/rle/index.mjs
console.error("RLE Codec Util\n");
switch (Deno.args[0]) {
  case "help":
    {
      console.info("c <length> <file>    Encode file in RLE.\nd <length> <file>    Decode file from RLE.\n\nThe length value must be the exact same!");
      break;
    }
    ;
  case "c":
    {
      let length = parseInt(Deno.args[1]);
      let fsFile = await Deno.open(Deno.args[2], { read: true, create: false });
      let encoder = new RLEEncoder(length);
      let fsTarget = await Deno.open(`${Deno.args[2]}.rle`, { read: true, write: true, createNew: true });
      let rleStream = encoder.encode(fsFile.readable);
      await rleStream.pipeTo(fsTarget.writable);
      break;
    }
    ;
  case "d":
    {
      let length = parseInt(Deno.args[1]);
      let fsFile = await Deno.open(Deno.args[2], { read: true, create: false });
      let decoder = new RLEDecoder(length);
      let fsTarget = await Deno.open(`${Deno.args[2]}.bak`, { read: true, write: true, createNew: true });
      let rleStream = decoder.decode(fsFile.readable);
      await rleStream.pipeTo(fsTarget.writable);
      break;
    }
    ;
  default:
    {
      console.error(`Invalid arguments.`);
    }
    ;
}
