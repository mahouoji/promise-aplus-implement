function promiseResolutionProcedure(promise, x, resolve, reject) {
  if (promise === x) {
    return reject(new TypeError('Chaining cycle detected for promise'));
  }

  if (x instanceof MyPromise) {
    x.then(
      (y) => promiseResolutionProcedure(promise, y, resolve, reject),
      reject
    );
    return;
  }

  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let thenCalledOrThrow = false;
    let then;
    try {
      then = x.then; // 2.3.3.1 value could change between retrievals
    } catch (e) {
      reject(e);
    }
    if (typeof then === 'function') {
      try {
        then.call(
          x,
          (y) => {
            if (thenCalledOrThrow) return;
            thenCalledOrThrow = true;
            promiseResolutionProcedure(promise, y, resolve, reject);
          },
          (r) => {
            if (thenCalledOrThrow) return;
            thenCalledOrThrow = true;
            reject(r);
          }
        );
      } catch (e) {
        if (thenCalledOrThrow) return;
        thenCalledOrThrow = true;
        reject(e); // 2.3.3.2
      }
    } else {
      resolve(x); // 2.3.3.4
    }
  } else {
    resolve(x); // 2.3.4
  }
}
class MyPromise {
  constructor(executor) {
    this.status = 'pending';
    this.data = undefined; // value or reason
    this.onFulfilledCallbacks = []; // 存放成功的回调
    this.onRejectedCallbacks = []; // 存放失败的回调

    try {
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (e) {
      // reject when executor failed
      this.reject(e);
    }
  }
  resolve(value) {
    if (this.status === 'pending') {
      this.status = 'fulfilled';
      this.data = value;
      setTimeout(() => {
        this.onFulfilledCallbacks.forEach((fn) => fn(this.data));
      });
    }
  }

  reject(reason) {
    if (this.status === 'pending') {
      this.status = 'rejected';
      this.data = reason;
      setTimeout(() => {
        this.onRejectedCallbacks.forEach((fn) => fn(this.data));
      });
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (v) => v;
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (r) => {
            throw r;
          };

    switch (this.status) {
      case 'fulfilled': {
        const promise = new MyPromise((resolve, reject) => {
          setTimeout(() => {
            try {
              const x = onFulfilled(this.data);
              promiseResolutionProcedure(promise, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
        return promise;
      }
      case 'rejected': {
        const promise = new MyPromise((resolve, reject) => {
          setTimeout(() => {
            try {
              const x = onRejected(this.data);
              promiseResolutionProcedure(promise, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
        return promise;
      }
      case 'pending': {
        const promise = new MyPromise((resolve, reject) => {
          this.onFulfilledCallbacks.push((value) => {
            try {
              const x = onFulfilled(value);
              promiseResolutionProcedure(promise, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
          this.onRejectedCallbacks.push((reason) => {
            try {
              const x = onRejected(reason);
              promiseResolutionProcedure(promise, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
        return promise;
      }
    }
  }
}

MyPromise.deferred = function () {
  let dfd = {};
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
};

try {
  module.exports = MyPromise;
} catch (e) {}

function thenable(value) {
  return {
    then: function (onFulfilled) {
      onFulfilled(value);
      throw other;
    },
  };
}
