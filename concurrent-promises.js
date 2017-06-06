const EventEmitter = require( 'events' ).EventEmitter;

class ConcurrentPromises extends EventEmitter {
  constructor( { resolver, concurrency = 8 } ) {
    super();
    this.resolver = resolver;
    this.results = [];
    this.done = false;
    this.concurrency = concurrency;
    this.doing = 0;
  }

  begin() {
    return this._resolverCaller( this );
  }

  _resolverCaller() {
    const that = this;
    return new Promise( resolve => {
      setInterval( () => {
        if ( that.doing < that.concurrency && that.done === false ) {
          that._callNext();
        }

        if ( that.done && that.doing === 0 ) {
          return resolve( that.results );
        }
      }, 100 );
    } );
  }

  async _callNext() {
    try {
      this.doing++;
      const result = await this.resolver();
      this.doing--;

      if ( result === null ) {
        this.done = true;
        return;
      }
      this.results.push( result );
    } catch ( e ) {
      this._emitRejected( e );
      this.doing--;
    }
  }

  _emitRejected( error ) {
    this.emit( 'onPromiseRejected', error );
  }

}

module.exports = ConcurrentPromises;
