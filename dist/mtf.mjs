// src/common/utils.mjs
var emitSingleByte = (byte) => {
  let buffer = new Uint8Array(1);
  buffer[0] = byte;
  return buffer;
};

// src/mtf/stream.mjs
var mtfDict = new Uint8Array(256);
var mtfiDict = new Uint8Array(256);
var highOrder = [6, 7, 4, 5, 3, 2, 0, 1, 14, 15, 12, 13, 10, 11, 8, 9];
for (let i = 0; i < mtfDict.length; i++) {
  let e = highOrder[i >> 4] << 4 | i & 15;
  mtfDict[i] = e;
  mtfiDict[e] = i;
}
var ptrMtf = function(dictIBuf, byte) {
  let targetPos = dictIBuf[byte];
  for (let i = 0; i < dictIBuf.length; i++) {
    if (dictIBuf[i] < targetPos) {
      dictIBuf[i]++;
    }
    ;
  }
  ;
  dictIBuf[byte] = 0;
};
var valMtf = function(dictBuf, byte) {
  let curPos = dictBuf.indexOf(byte);
  if (curPos) {
    console.error(`Current position: ${curPos}`);
    dictBuf.set(dictBuf.subarray(0, curPos), 1);
    dictBuf[0] = byte;
  }
  ;
};
var MTFEncoder = class {
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
            newController.enqueue(emitSingleByte(streamIDict[e]));
            ptrMtf(streamIDict, e);
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
var MTFDecoder = class {
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
            let byte = streamDict[e];
            newController.enqueue(emitSingleByte(byte));
            valMtf(streamDict, byte);
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

// src/mtf/index.mjs
console.error("MTF Codec Util\n");
switch (Deno.args[0]) {
  case "help":
    {
      console.info("c <file>    Encode file in MTF.\nd <file>    Decode file from MTF.\n\nThe length value must be the exact same!");
      break;
    }
    ;
  case "c":
    {
      let fsFile = await Deno.open(Deno.args[1], { read: true, create: false });
      let encoder = new MTFEncoder();
      let fsTarget = await Deno.open(`${Deno.args[1]}.mtf`, { read: true, write: true, createNew: true });
      let mtfStream = encoder.encode(fsFile.readable);
      await mtfStream.pipeTo(fsTarget.writable);
      break;
    }
    ;
  case "d":
    {
      let fsFile = await Deno.open(Deno.args[1], { read: true, create: false });
      let decoder = new MTFDecoder();
      let fsTarget = await Deno.open(`${Deno.args[1]}.bak`, { read: true, write: true, createNew: true });
      let mtfStream = decoder.decode(fsFile.readable);
      await mtfStream.pipeTo(fsTarget.writable);
      break;
    }
    ;
  default:
    {
      console.error(`Invalid arguments.`);
    }
    ;
}
