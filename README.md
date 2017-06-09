# Concurrent-promises
[![Build Status](https://travis-ci.org/waldemarnt/concurrent-promises.svg?branch=master)](https://travis-ci.org/waldemarnt/concurrent-promises)

Sometimes we want to limit the number of concurrent promises like in HTTP requests or I/O. This library allows limit the number of concorrency.

# Example

The example below showns how this lib works. You will need a resolver which is the function that will called recursively by concurrentPromises and the number of concurrent promises that will run (default is 8).

In this case are created 10 promises that are resolved in a different time to simulate an assincronous I/O.
To finish the conrrentPromises caller you should return *null*;

```javascript
    it('should limit of concurrent requests', () => {
      let count = 0;
      const resolver = () => {
        return new Promise(resolve => {
          if(count < 10) {
            count++;
            return setTimeout(() => {
              resolve(true);
            }, Math.floor((Math.random() * 1000) + 1));
          }
          return resolve(null);
        });
      };

      const concurrentPromises = new ConcurrentPromises({resolver, concurrency: 3});

      return concurrentPromises.begin()
        .then(result => {
          expect(result.length).to.be.eql(10);
        });
    });
```
