/*
**  tag.js
*/
"use strict"

var fs = require('fs');

/*
** Tagger Class
** allow manipulation of the tags of an mp3 file
** supports ID3V1 / ID3V1 Extended / ID3V2.4.0
*/
class tagger {
  constructor(file_name) {
    this.data = fs.readFileSync(file_name);
    this.id3v1 = new ID3V1(this.data);
    this.id3v1_e = new ID3V1_E(this.data);
    this.ad3v2 = new ID3V2(this.data);
  }

  get ID3V1() {
    return ((this.id3v1.valid) ? this.id3v1 : undefined);
  }

  get ID3V1_E() {
    return ((this.id3v1_e.valid) ? this.id3v1_e : undefined);
  }

  get ID3V2() { return this.id3v2; }
}

/*
** ID3V1 Class
** getters :
**  - header      // TAG
**  - title
**  - artist
**  - album
**  - year
**  - comment
**  - track
**  - genre
*/
class ID3V1 {

  constructor(data) {
    this.tag = new Buffer(128);
    data.copy(this.tag, 0, data.length - 128, data.length);
    this.valid = (this.header == 'TAG') ? true : false;
  }

  get header() { return this.tag.toString('ascii', 0, 3); }

  get title() { return this.tag.toString('ascii', 3, 33); }

  get artist() { return this.tag.toString('ascii', 33, 63); }

  get album() { return this.tag.toString('ascii', 63, 93); }

  get year() { return this.tag.toString('ascii', 93, 97); }

  get comment() { return this.tag.toString('ascii', 97, 127); }

  get track() {
    return (this.tag[125] == 0) ? this.tag[126] : undefined;
  }

  get genre() { return this.tag[127]; }

}

/*
** ID3V1_E Class
** getters :
**  - header      // TAG+
**  - title
**  - artist
**  - album
**  - speed
**  - genre
**  - start
**  - end
*/
class ID3V1_E {

  constructor(data) {
    this.tag = new Buffer(227);
    data.copy(this.tag, 0, data.length - 128 - 227, data.length - 128);
    this.valid = (this.header == 'TAG+') ? true : false;
  }

  get header() { return this.tag.toString('ascii', 0, 4); }
  set header(data) { data.copy(this.tag, 0, 4, 0); }

  get title() { return this.tag.toString('ascii', 4, 64); }

  get artist() { return this.tag.toString('ascii', 64, 124); }

  get album() { return this.tag.toString('ascii', 124, 184); }

  get speed() {
    switch (this.tag[184]) {
      case 0 : return 'unset';
      case 1 : return 'slow';
      case 2 : return 'medium';
      case 3 : return 'fast';
      case 4 : return 'hardcore';
      default : return undefined;
    }
  }

  get genre() { return this.tag.toString('ascii', 185, 215); }

  get start() { return this.tag.toString('ascii', 215, 221); }

  get end() { return this.tag.toString('ascii', 221, 227); }

}

/*
** ID3V2 Class
** defines :
**  - header      // ID3
**  - version     // Version of ID3V2
**  - extended    // Extended byte
**  - tag_size    // Size of tag (with header)
**  - frames      // Array containing all the frames
*/

function decodeSynchSafeSize(byte0, byte1, byte2, byte3) {
    return (byte0 << 21) | (byte1 << 14) | (byte2 << 7) | byte3;
}

function readInt(byte0, byte1, byte2, byte3) {
  return (byte0 << 24) | (byte1 << 16) | (byte2 << 8) | byte3;
}

class ID3V2 {

  constructor(data) {
    this.header   = data.toString('ascii', 0, 3);
    this.version  = data[3];
    this.unsynch  = data[4] & 0x80;
    this.extended = data[4] & 0x40;
    this.tag_size = decodeSynchSafeSize(data[6], data[7], data[8], data[9]);
    this.data     = new Buffer(this.tag_size);
    data.copy(this.data, 0, 0, this.tag_size);
    this.frames   = [];

    // DEBUG
    console.log('version : ' + this.version + ' / unsynch : ' + this.unsynch + ' / extended : ' + this.extended + ' / tag_size : ' + this.tag_size);

    for (var i = 10; i <= this.tag_size;) {
      var frame = {};

      if (this.data[i] == 0) {
        // end of frames, start of padding section
        this.padding_size = this.tag_size - i;
        break ;
      }

      frame.id      = this.data.toString('ascii', i, i + 4);
      frame.offset  = i;
      frame.size    = readInt(this.data[i + 4], this.data[i + 5], this.data[i + 6], this.data[i + 7]);
      frame.content = new Buffer(frame.size);
      this.data.copy(frame.content, 0, i + 10, i + 10 + frame.size);
      this.frames.push(frame);

      i += frame.size + 10;
    }
  }

}

/*
** Module exports
*/
module.exports = {
  'tagger' : tagger
}
