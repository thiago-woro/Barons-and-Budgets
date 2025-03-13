
    function myFunction() {
      console.log('Hello from myFunction');
    }

    const arrowFunction = () => {
      console.log('Hello from arrowFunction');
    };

    const obj = {
      method(){
          console.log('hello from method')
      }
    }

    function anotherFunction(callback) {
      callback();
    }

    anotherFunction(function() {
      console.log('Hello from anonymous function');
    });

    