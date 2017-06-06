const ConcurrentPromises = require('../../concurrent-promises');
const chai = require('chai');
const expect = chai.expect;

describe('ConcurrentPromises', () => {
  describe('begin concurrency', () => {

    it('should call two promises', () => {
      let count = 0;
      const resolver = () => {
        return new Promise(resolve => {
          if(count < 2) {
            count++;
            return resolve(true);
          }
          return resolve(null);
        });
      };

      const concurrentPromises = new ConcurrentPromises({resolver});

      return concurrentPromises.begin()
        .then(result => {
          expect(result.length).to.be.eql(2);
        });
    });

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

    it('should merge correctly independet of the order that they are called', () => {
      let count = 0;
      const testArray = Array.from( Array(10).keys() ).map(n => ({ name: `name_${n}` }) );
      const responseItems = [];
      const resolver = () => {
        const item = testArray.pop();
        return new Promise(resolve => {
          if(count < 10) {
            count++;
            return setTimeout(() => {
              resolve(item);
            }, Math.floor((Math.random() * 200) + 1));
          }
          return resolve(null);
        })
          .then(responseItem => {
            if(responseItem !== null) {
              responseItem.meta = item.name
              responseItems.push(responseItem);
              return;
            }
            return responseItem;
          })
      };

      const concurrentPromises = new ConcurrentPromises({resolver, concurrency: 3});

      return concurrentPromises.begin()
        .then(result => {
          const wrongMerged = responseItems.filter(item => item.name !== item.meta);
          expect(wrongMerged).to.be.empty;
        });
    });

    it('should supress the 3 errors and finish all promises', () => {
      let count = 0;
      const resolver = () => {
        return new Promise((resolve, reject) => {
          if(count < 10) {
            count++;
            if(count % 3 == 0) {
              return setTimeout(() => {
                reject(true);
              }, Math.floor((Math.random() * 1000) + 1));
            }
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
          expect(result.length).to.be.eql(7);
        });
    });

    it('should allow rejected promises be handled', () => {
      let count = 0;
      const resolver = () => {
        return new Promise((resolve, reject) => {
          if(count <= 1) {
            count++;
            return reject(true);
          }
          return resolve(null);
        })
          .catch(error => {})
      };

      const concurrentPromises = new ConcurrentPromises({resolver, concurrency: 3});

      return concurrentPromises.begin()
        .then(result => {
          expect(result.length).to.be.eql(2);
        });
    });

    it('should  retry 2 on reject promises that are handled', () => {
      let count = 0;
      const data = [{name: 'test1', retries: 0}, {name: 'test2', retries: 0}, {name:'test3', retries:0}];
      let isDone = false;
      let doing = 0;

      const resolver = () => {
        count++;
        if(count <= 10) {
          const testObject = data.pop();
          return new Promise((resolve, reject) => {
            doing++;
            if(testObject && testObject.name == 'test2' ) {
              return setTimeout(() => {
                reject({code: 408});
              }, Math.floor((Math.random() * 100) + 1));
            }
            return setTimeout(() => {
              resolve(true);
            }, Math.floor((Math.random() * 100) + 1));
          })
            .catch(e => {
              if(e.code == 408) {
                if(testObject.retries < 2) {
                  testObject.retries++;
                  data.push(testObject)
                }
              }
            })
            .then(res => {
              doing--;
              return res;
            })
        }else if(doing == 0) {
          return Promise.resolve(null);
        }
      };

      const concurrentPromises = new ConcurrentPromises({resolver, concurrency: 3});

      return concurrentPromises.begin()
        .then(result => {
          expect(result.length).to.be.eql(10);
        });
    });

    it('should  retry 1 on a reject promise that are handled and fulfill at second try', () => {
      let count = 0;
      const data = [{name: 'test1', retries: 0}, {name: 'test2', retries: 0}, {name:'test3', retries:0}];
      let isDone = false;
      let doing = 0;

      const resolver = () => {
        count++;
        if(count <= 10) {
          const testObject = data.pop();
          return new Promise((resolve, reject) => {
            doing++;
            if(testObject && testObject.name == 'test2' && testObject.retries < 1 ) {
              return setTimeout(() => {
                reject({code: 408});
              }, Math.floor((Math.random() * 100) + 1));
            }
            return setTimeout(() => {
              resolve(true);
            }, Math.floor((Math.random() * 100) + 1));
          })
            .catch(e => {
              if(e.code == 408) {
                if(testObject.retries < 2) {
                  testObject.retries++;
                  data.push(testObject)
                }
              }
            })
            .then(res => {
              doing--;
              return res;
            })
        }else if(doing == 0) {
          return Promise.resolve(null);
        }
      };

      const concurrentPromises = new ConcurrentPromises({resolver, concurrency: 3});

      return concurrentPromises.begin()
        .then(result => {
          const failedCount = result.reduce((acc, val) => {
            if(acc == undefined) {
              return val++;
            }
          }, 0);
          expect(failedCount).to.be.eql(1);
          expect(result.length).to.be.eql(10);
        });
    });
  });
});
