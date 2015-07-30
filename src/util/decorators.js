'use strict'; 'use strong';

function Base(name) {
    return (obj) => { global.app[ name ](obj.prototype.constructor.name, obj); };
}

const Model = Base('Model');

export {Model};