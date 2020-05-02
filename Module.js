/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('evado/component/base/BaseModule');

module.exports = class NavigationApiModule extends Base {

    static getConstants () {
        return {
            NAME: 'navigation'
        };
    }
};
module.exports.init(module);