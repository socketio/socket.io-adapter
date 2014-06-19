
/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter;
var parser = require('socket.io-parser');

/**
 * Module exports.
 */

module.exports = Adapter;

/**
 * Memory adapter constructor.
 *
 * @param {Namespace} nsp
 * @api public
 */

function Adapter(nsp){
  this.nsp = nsp;
  this.rooms = {};
  this.sids = {};
  this.encoder = new parser.Encoder();
}

/**
 * Inherits from `EventEmitter`.
 */

Adapter.prototype = Object.create(Emitter.prototype);

/**
 * Adds a socket from a room.
 *
 * @param {String} socket id
 * @param {String} room name
 * @param {Function} callback
 * @api public
 */

Adapter.prototype.add = function(id, room, fn){
  this.sids[id] = this.sids[id] || {};
  this.sids[id][room] = true;
  this.rooms[room] = this.rooms[room] || [];
  this.rooms[room][id] = true;
  if (fn) process.nextTick(fn.bind(null, null));
};

/**
 * Removes a socket from a room.
 *
 * @param {String} socket id
 * @param {String} room name
 * @param {Function} callback
 * @api public
 */

Adapter.prototype.del = function(id, room, fn){
  this.sids[id] = this.sids[id] || {};
  this.rooms[room] = this.rooms[room] || {};
  delete this.sids[id][room];
  delete this.rooms[room][id];
  if (fn) process.nextTick(fn.bind(null, null));
};

/**
 * Removes a socket from all rooms it's joined.
 *
 * @param {String} socket id
 * @api public
 */

Adapter.prototype.delAll = function(id, fn){
  var rooms = this.sids[id];
  if (rooms) {
    for (var room in rooms) {
      delete this.rooms[room][id];
    }
  }
  delete this.sids[id];
};


/**
 * Get all clients in room.
 *
 * @param {String} room id
 * @api public
 */
Adapter.prototype.clients = function(room, fn){
  // One argument
  if(!fn){
    if(typeof(room) !== 'function'){
      return;
    }
    fn = room;
    room = null;
  }

  var result;
  if(room === null){
    result = Object.keys(this.sids || []);
  }
  else{
    result = Object.keys(this.rooms[room] || []);
  }
  process.nextTick(fn.bind(null, null, result));
};


/**
 * Broadcasts a packet.
 *
 * Options:
 *  - `flags` {Object} flags for this packet
 *  - `except` {Array} sids that should be excluded
 *  - `rooms` {Array} list of rooms to broadcast to
 *
 * @param {Object} packet object
 * @api public
 */

Adapter.prototype.broadcast = function(packet, opts){
  var rooms = opts.rooms || [];
  var except = opts.except || [];
  var flags = opts.flags || {};
  var ids = {};
  var self = this;
  var socket;

  packet.nsp = this.nsp.name;
  this.encoder.encode(packet, function(encodedPackets) {
    if (rooms.length) {
      for (var i = 0; i < rooms.length; i++) {
        var room = self.rooms[rooms[i]];
        if (!room) continue;
        for (var id in room) {
          if (ids[id] || ~except.indexOf(id)) continue;
          socket = self.nsp.connected[id];
          if (socket) {
            socket.packet(encodedPackets, true, flags.volatile);
            ids[id] = true;
          }
        }
      }
    } else {
      for (var id in self.sids) {
        if (~except.indexOf(id)) continue;
        socket = self.nsp.connected[id];
        if (socket) socket.packet(encodedPackets, true, flags.volatile);
      }
    }
  });
};
