var expect = require('expect.js');
var async = require('async');
var Adapter = require('../index.js');

describe('socket.io-adapter', function(){
  var adapter;
  describe('Adapter', function(){
    it('should construct the adapter', function(){
      adapter = new Adapter('test');
      expect(adapter).to.be.an(Adapter);
    });
  });
  describe('add', function(){
    it('should add a socket to a room', function(){
      var room = 'a';
      var sid = '1';
      adapter.add(sid, room, function(){
        expect(adapter.sids).to.be.an('object');
        expect(adapter.sids[sid]).to.be.an('object');
        expect(adapter.sids[sid][room]).to.equal(true);
        expect(adapter.rooms[room]).to.be.an('object');
        expect(adapter.rooms[room][sid]).to.equal(true);
      });
    });
  });
  describe('del', function(){
    it('should remove a socket from aroom', function(){
      var room = 'a';
      var sid = '1';
      adapter.del(sid, room);
      expect(adapter.sids[sid]).to.not.contain(room);
      expect(adapter.rooms[room]).to.not.contain(room);
    });
  });
  describe('delAll', function(){
    var sid = 'a';
    var rooms = [];

    before(function(done){
      //Clear rooms and sockets
      adapter.sids = {};
      adapter.rooms = {};

      //Add the socket to multiple rooms
      async.times(10, function(n, next){
        rooms.push(n);
        adapter.add(sid, n, function(){
          next();
        });
      }, done);
    });

    it('should remove a socket from all rooms', function(done){
      var rooms = Object.keys(adapter.rooms);
      var i;
      for(i=0; i<rooms.length; ++i){
        expect(adapter.rooms[rooms[i]]).to.have.key(sid);
      }
      adapter.delAll(sid);
      for(i=0; i<rooms.length; ++i){
        expect(adapter.rooms[rooms[i]]).to.not.have.key(sid);
      }
      done();
    });
  });
  describe('clients', function(){
    var room = 'a';
    var sids = [];

    before(function(done){
      //Clear rooms and sockets
      adapter.sids = {};
      adapter.rooms = {};

      //Add the socket to multiple rooms
      async.times(10, function(n, next){
        n = n.toString();
        sids.push(n);
        adapter.add(n, room, function(){
          next();
        });
      }, done);
    });
    it('should get all clients in a room', function(done){
      adapter.clients(room, function(err, clients){
        expect(clients).to.only.have.keys(sids);
        done();
      });
    });
  });
});
